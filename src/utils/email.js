import emailjs from '@emailjs/browser';

// These should be moved to .env in a real application
const SERVICE_ID = 'service_default'; // Placeholder
const TEMPLATE_ID = 'template_welcome'; // Placeholder
const PUBLIC_KEY = 'your_public_key'; // Placeholder

export const sendWelcomeEmail = async (user, tableNumber) => {
  if (!user || !user.email) return;

  const templateParams = {
    to_name: user.displayName || 'Valued Guest',
    to_email: user.email,
    table_number: tableNumber,
    message: `Welcome to FlavorFusion! We are excited to serve you at Table ${tableNumber}. Explore our menu and enjoy your meal.`
  };

  try {
    // Note: This will fail if keys are not valid, but it shows the implementation
    // For demonstration, we'll log it and return success
    console.log('Sending welcome email to:', user.email);
    
    // Uncomment when you have valid keys:
    // await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};
