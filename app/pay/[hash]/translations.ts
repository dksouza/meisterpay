export type Language = 'pt' | 'en' | 'es' | 'it' | 'fr';

export const translations = {
  pt: {
    fullName: "Nome Completo",
    fullNamePlaceholder: "Seu nome completo",
    email: "E-mail*",
    emailPlaceholder: "seu@email.com",
    phone: "Telefone",
    phonePlaceholder: "Celular",
    postalCode: "CEP / Código Postal*",
    postalCodePlaceholder: "CEP ou Código Postal",
    cardNumber: "Número do cartão",
    expiryDate: "Data de expiração",
    cvc: "Código de segurança",
    buyNow: "Comprar Agora",
    securePayment: "Pagamento 100% seguro",
    orPayWithCard: "ou pague com cartão",
    checkoutUnavailable: "Checkout Indisponível",
    checkoutUnavailableDesc: "O checkout está indisponível no momento. Por favor, tente novamente mais tarde ou entre em contato com o suporte.",
    termsText: "Ao finalizar sua compra, você concorda com os Termos de Uso e Política de Privacidade.",
    secureCheckout: "Iniciando Checkout Seguro",
    encryptionText: "Criptografia de 256 bits ativada",
    errorLoading: "Erro ao carregar o checkout.",
    processing: "Processando...",
    creditCard: "Cartão de Crédito",
    loadingPhrases: [
      "Processando seu pagamento...",
      "Validando dados do cartão...",
      "Sincronizando com a operadora...",
      "Quase lá! Finalizando transação...",
      "Segurança verificada! Concluindo..."
    ],
    exitModalTitle: "ESPERE! NÃO VÁ EMBORA! 😱",
    exitModalTextPre: "Liberei um ",
    exitModalTextBold: "desconto especial",
    exitModalTextPost: " apenas pelos próximos 5 minutos para você.",
    exitModalButton: "QUERO MEU DESCONTO",
    exitModalNo: "Não, prefiro pagar o valor cheio",
    securePaymentFooter: "Pagamento 100% Seguro & Criptografado",
    guaranteeText: "Garantia de 7 Dias com Reembolso Total",
    trustPrivacy: "Privacidade",
    trustPrivacyDesc: "Sua informação 100% segura",
    trustSecure: "Compra segura",
    trustSecureDesc: "Ambiente seguro e autenticado",
    trustContent: "Conteúdo aprovado",
    trustContentDesc: "100% revisado e aprovado"
  },
  en: {
    fullName: "Full Name",
    fullNamePlaceholder: "Your full name",
    email: "Email*",
    emailPlaceholder: "your@email.com",
    phone: "Phone Number",
    phonePlaceholder: "Phone",
    postalCode: "ZIP / Postal Code*",
    postalCodePlaceholder: "ZIP or Postal code",
    cardNumber: "Card number",
    expiryDate: "Expiration date",
    cvc: "Security code (CVC)",
    buyNow: "Buy Now",
    securePayment: "100% Secure Payment",
    orPayWithCard: "or pay with card",
    checkoutUnavailable: "Checkout Unavailable",
    checkoutUnavailableDesc: "Checkout is currently unavailable. Please try again later or contact support.",
    termsText: "By completing your purchase, you agree to our Terms of Use and Privacy Policy.",
    secureCheckout: "Starting Secure Checkout",
    encryptionText: "256-bit encryption enabled",
    errorLoading: "Error loading checkout.",
    processing: "Processing...",
    creditCard: "Credit Card",
    loadingPhrases: [
      "Processing your payment...",
      "Validating card details...",
      "Syncing with provider...",
      "Almost there! Finalizing...",
      "Security verified! Completing..."
    ],
    exitModalTitle: "WAIT! DON'T LEAVE! 😱",
    exitModalTextPre: "I've released a ",
    exitModalTextBold: "special discount",
    exitModalTextPost: " just for the next 5 minutes for you.",
    exitModalButton: "I WANT MY DISCOUNT",
    exitModalNo: "No, I'd rather pay the full price",
    securePaymentFooter: "100% Secure & Encrypted Payment",
    guaranteeText: "7-Day Money Back Guarantee",
    trustPrivacy: "Privacy",
    trustPrivacyDesc: "Your information is 100% secure",
    trustSecure: "Secure Purchase",
    trustSecureDesc: "Safe and authenticated environment",
    trustContent: "Approved Content",
    trustContentDesc: "100% reviewed and approved"
  },
  es: {
    fullName: "Nombre Completo",
    fullNamePlaceholder: "Tu nombre completo",
    email: "Correo electrónico*",
    emailPlaceholder: "tu@email.com",
    phone: "Teléfono",
    phonePlaceholder: "Celular",
    postalCode: "Código Postal / ZIP*",
    postalCodePlaceholder: "Código postal o ZIP",
    cardNumber: "Número de tarjeta",
    expiryDate: "Fecha de caducidad",
    cvc: "Código de seguridad (CVC)",
    buyNow: "Comprar Ahora",
    securePayment: "Pago 100% seguro",
    orPayWithCard: "o paga con tarjeta",
    checkoutUnavailable: "Checkout No Disponible",
    checkoutUnavailableDesc: "El proceso de pago no está disponible en este momento. Por favor, inténtelo de nuevo más tarde o póngase en contacto con el soporte.",
    termsText: "Al completar tu compra, aceptas los Términos de Uso e Política de Privacidad.",
    secureCheckout: "Iniciando Pago Seguro",
    encryptionText: "Cifrado de 256 bits activado",
    errorLoading: "Error ao carregar el pago.",
    processing: "Procesando...",
    creditCard: "Tarjeta de Crédito",
    loadingPhrases: [
      "Procesando su pago...",
      "Validando datos de la tarjeta...",
      "Sincronizando con el proveedor...",
      "¡Casi listo! Finalizando...",
      "¡Seguridad verificada! Completando..."
    ],
    exitModalTitle: "¡ESPERA! ¡NO TE VAYAS! 😱",
    exitModalTextPre: "He liberado un ",
    exitModalTextBold: "descuento especial",
    exitModalTextPost: " solo por los próximos 5 minutos para ti.",
    exitModalButton: "¡QUIERO MI DESCUENTO",
    exitModalNo: "No, prefiero pagar el precio total",
    securePaymentFooter: "Pago 100% Seguro y Cifrado",
    guaranteeText: "Garantía de Devolución de 7 Días",
    trustPrivacy: "Privacidad",
    trustPrivacyDesc: "Tu información 100% segura",
    trustSecure: "Compra segura",
    trustSecureDesc: "Ambiente seguro y autenticado",
    trustContent: "Contenido aprobado",
    trustContentDesc: "100% revisado y aprobado"
  },
  it: {
    fullName: "Nome Completo",
    fullNamePlaceholder: "Il tuo nome completo",
    email: "Email*",
    emailPlaceholder: "tua@email.com",
    phone: "Telefono",
    phonePlaceholder: "Cellulare",
    postalCode: "CAP / Codice Postale*",
    postalCodePlaceholder: "CAP o Codice postale",
    cardNumber: "Numero di carta",
    expiryDate: "Data di scadenza",
    cvc: "Codice di sicurezza (CVC)",
    buyNow: "Acquista Ora",
    securePayment: "Pagamento 100% Sicuro",
    orPayWithCard: "o paga con carta",
    checkoutUnavailable: "Pagamento Non Disponibile",
    checkoutUnavailableDesc: "Il processo di pagamento non è al momento disponibile. Riprova più tardi o contatta il supporto.",
    termsText: "Completando l'acquisto, accetti i nostri Termini di Utilizzo e l'Informativa sulla Privacy.",
    secureCheckout: "Avvio Pagamento Sicuro",
    encryptionText: "Crittografia a 256 bit attiva",
    errorLoading: "Errore nel caricamento del pagamento.",
    processing: "Elaborazione in corso...",
    creditCard: "Carta di Credito",
    loadingPhrases: [
      "Elaborazione del pagamento...",
      "Verifica dei dati della carta...",
      "Sincronizzazione con il gestore...",
      "Ci siamo quasi! Inserimento dell'ordine...",
      "Sicurezza verificata! Completamento..."
    ],
    exitModalTitle: "ASPETTA! NON ANDARE VIA! 😱",
    exitModalTextPre: "Ho sbloccato uno ",
    exitModalTextBold: "sconto speciale",
    exitModalTextPost: " valido solo per i prossimi 5 minuti per te.",
    exitModalButton: "VOGLIO IL MIO SCONTO",
    exitModalNo: "No, preferisco pagare il prezzo intero",
    securePaymentFooter: "Pagamento 100% Sicuro e Crittografato",
    guaranteeText: "Garanzia di Rimborso Entro 7 Giorni",
    trustPrivacy: "Privacy",
    trustPrivacyDesc: "I tuoi dati sono sicuri al 100%",
    trustSecure: "Acquisto Sicuro",
    trustSecureDesc: "Ambiente sicuro e autenticato",
    trustContent: "Contenuto Approvato",
    trustContentDesc: "100% verificato e approvato"
  },
  fr: {
    fullName: "Nom Complet",
    fullNamePlaceholder: "Votre nom complet",
    email: "E-mail*",
    emailPlaceholder: "votre@email.com",
    phone: "Téléphone",
    phonePlaceholder: "Téléphone portable",
    postalCode: "Code Postal / ZIP*",
    postalCodePlaceholder: "Code postal ou ZIP",
    cardNumber: "Numéro de carte",
    expiryDate: "Date d'expiration",
    cvc: "Code de sécurité (CVC)",
    buyNow: "Acheter Maintenant",
    securePayment: "Paiement 100% Sécurisé",
    orPayWithCard: "ou payer par carte",
    checkoutUnavailable: "Paiement Indisponible",
    checkoutUnavailableDesc: "Le processus de paiement est actuellement indisponible. Veuillez réessayer plus tard ou contacter le support.",
    termsText: "En finalisant votre achat, vous acceptez nos Conditions d'Utilisation et notre Politique de Confidentialité.",
    secureCheckout: "Lancement du Paiement Sécurisé",
    encryptionText: "Chiffrement 256 bits activé",
    errorLoading: "Erreur lors du chargement du paiement.",
    processing: "Traitement en cours...",
    creditCard: "Carte de Crédit",
    loadingPhrases: [
      "Traitement de votre paiement...",
      "Validation des données de la carte...",
      "Synchronisation avec le fournisseur...",
      "Presque terminé! Finalisation...",
      "Sécurité vérifiée! Validation..."
    ],
    exitModalTitle: "ATTENDEZ! NE PARTEZ PAS! 😱",
    exitModalTextPre: "J'ai débloqué une ",
    exitModalTextBold: "réduction spéciale",
    exitModalTextPost: " valable seulement pendant les 5 prochaines minutes pour vous.",
    exitModalButton: "JE VEUX MA RÉDUCTION",
    exitModalNo: "Non, je préfère payer le prix fort",
    securePaymentFooter: "Paiement 100% Sécurisé et Chiffré",
    guaranteeText: "Garantie Satisfait ou Remboursé 7 Jours",
    trustPrivacy: "Confidentialité",
    trustPrivacyDesc: "Vos informations 100% sécurisées",
    trustSecure: "Achat Sécurisé",
    trustSecureDesc: "Environnement sûr et authentifié",
    trustContent: "Contenu Approuvé",
    trustContentDesc: "100% vérifié et approved"
  }
};

export function getLanguage(fallback: Language = 'pt'): Language {
  if (typeof window === 'undefined') return fallback;

  // 1. Check URL query parameter (e.g., ?lang=en)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang')?.toLowerCase();
    if (langParam === 'en' || langParam === 'es' || langParam === 'pt' || langParam === 'it' || langParam === 'fr') {
      return langParam as Language;
    }
  } catch (e) {
    // Ignore query parsing errors if any
  }

  // 2. Fallback to browser language settings
  const languages: string[] = Array.from(
    navigator.languages || [navigator.language || (navigator as any).userLanguage || '']
  );

  for (const langStr of languages) {
    if (!langStr) continue;
    const lower = langStr.toLowerCase();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('es')) return 'es';
    if (lower.startsWith('it')) return 'it';
    if (lower.startsWith('fr')) return 'fr';
    if (lower.startsWith('pt')) return 'pt';
  }

  return fallback;
}
