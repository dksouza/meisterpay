"use server";

import { createClient } from "../../lib/supabase/server";
import { createAdminClient } from "../../lib/supabase/admin";
import { sendEmail } from "../../lib/mail";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.meisterpay.com.br'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData, originUrl?: string) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email) {
    return { error: "Por favor, informe o seu e-mail." };
  }

  try {
    const supabaseAdmin = createAdminClient();

    // Verify if user exists in profiles or auth
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      // Return friendly message for security (don't reveal user existence)
      return { success: "Se o e-mail estiver cadastrado em nossa plataforma, você receberá um link de redefinição em breve." };
    }

    const baseUrl = (originUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.meisterpay.com.br').replace(/\/$/, '');
    const redirectTo = `${baseUrl}/redefinir-senha`;

    console.log(`[PASSWORD_RESET] Gerando link para ${email} com redirectTo: ${redirectTo}`);

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo,
      },
    });

    if (error || !data.properties?.action_link) {
      console.error("[PASSWORD_RESET] Erro ao gerar link de recuperação:", error);
      return { error: "Erro ao gerar link de recuperação. Tente novamente." };
    }

    const resetLink = data.properties.action_link;

    const emailResult = await sendEmail({
      to: email,
      subject: "meisterpay | Redefinição de Senha",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #8b5cf6; margin: 0; font-size: 26px; font-weight: bold;">meisterpay</h2>
          </div>
          <div style="background-color: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h3 style="color: #111827; margin-top: 0; font-size: 20px;">Recuperação de Senha</h3>
            <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              Olá, <strong>${profile.full_name || 'Usuário'}</strong>.<br/><br/>
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>meisterpay</strong>. Clique no botão abaixo para escolher uma nova senha:
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #8b5cf6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                Redefinir Minha Senha
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 0;">
              Se o botão acima não funcionar, você também pode copiar e colar o link abaixo no seu navegador:<br/>
              <a href="${resetLink}" style="color: #8b5cf6; word-break: break-all;">${resetLink}</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 28px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              Se você não solicitou a redefinição de senha, nenhuma ação é necessária e sua senha atual continuará a mesma.
            </p>
          </div>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("[PASSWORD_RESET] Erro ao enviar e-mail via Resend:", emailResult.error);
      return { error: "Erro ao enviar o e-mail de recuperação. Tente novamente." };
    }

    return { success: "E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada." };
  } catch (err: any) {
    console.error("[PASSWORD_RESET] Exceção:", err);
    return { error: "Ocorreu um erro ao processar a solicitação. Tente novamente." };
  }
}

export async function updatePasswordWithToken(token: string, newPassword: string) {
  if (!token) {
    return { error: "Sessão de recuperação ausente ou expirada. Solicite um novo e-mail." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: "A senha deve conter no mínimo 6 caracteres." };
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      console.error("[PASSWORD_UPDATE] Error validating token:", userErr);
      return { error: "Link de recuperação inválido ou expirado. Por favor, solicite um novo e-mail." };
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) {
      console.error("[PASSWORD_UPDATE] Error updating password:", updateErr);
      return { error: updateErr.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[PASSWORD_UPDATE] Exception:", err);
    return { error: "Falha ao redefinir a senha. Tente novamente." };
  }
}

export async function getUserStatus(accessToken?: string) {
  const supabase = await createClient();

  let user = null;

  if (accessToken) {
    const { data: { user: jwtUser }, error: jwtError } = await supabase.auth.getUser(accessToken);
    if (!jwtError && jwtUser) {
      user = jwtUser;
    }
  }

  if (!user) {
    const { data: { user: cookieUser } } = await supabase.auth.getUser();
    user = cookieUser;
  }

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, is_admin, stripe_customer_id, billing_failed_attempts, has_seen_stripe_guide")
    .eq("id", user.id)
    .single();

  let hasValidCard = false;
  if (profile?.is_admin) {
    hasValidCard = true;
  } else if (profile?.stripe_customer_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2023-10-16",
      } as any);
      const paymentMethods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: "card",
      });
      hasValidCard = paymentMethods.data.length > 0;
    } catch (err) {
      console.error("[AuthActions] Error fetching seller card:", err);
    }
  }

  return {
    status: profile?.status || 'pending',
    isAdmin: profile?.is_admin || false,
    hasValidCard,
    isBlockedByBilling: (profile?.billing_failed_attempts || 0) >= 3,
    hasSeenStripeGuide: (profile as any)?.has_seen_stripe_guide ?? false
  };
}

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const oldPassword = formData.get("old_password") as string;
  const newPassword = formData.get("new_password") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Não autenticado" };

  // Verify old password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (signInError) {
    return { error: "Senha antiga incorreta." };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: "Senha alterada com sucesso!" };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  const checkout_head_scripts = formData.get("checkout_head_scripts") as string;

  console.log(`[UPDATE-PROFILE] Usando UPSERT para o usuário: ${user.id}`);

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      checkout_head_scripts,
      email: user.email // Garante que o e-mail esteja lá caso seja um novo registro
    })
    .select();

  if (error) {
    console.error("[UPDATE-PROFILE] Erro do Supabase:", error);
    return { error: error.message };
  }

  console.log("[UPDATE-PROFILE] Sucesso ao salvar perfil.");

  revalidatePath("/configuracoes");
  return { success: "Configurações atualizadas com sucesso!" };
}

export async function markStripeGuideAsSeen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Não autenticado" };

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ has_seen_stripe_guide: true })
      .eq("id", user.id);

    if (error) {
      console.error("[markStripeGuideAsSeen] Error updating profile:", error);
      return { error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[markStripeGuideAsSeen] Exception:", err);
    return { error: err?.message || "Erro ao atualizar perfil" };
  }
}
