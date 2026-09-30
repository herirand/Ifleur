import emailjs, { EmailJSResponseStatus } from '@emailjs/nodejs';
import { AppError } from '../../lib/appError';
import { SendEmailDto } from './email.dto';

export async function sendOrderEmail(dto: SendEmailDto): Promise<void> {
  const {
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY,
  } = process.env;

  if (
    !EMAILJS_SERVICE_ID ||
    !EMAILJS_TEMPLATE_ID ||
    !EMAILJS_PUBLIC_KEY ||
    !EMAILJS_PRIVATE_KEY
  ) {
    throw new AppError(
      500,
      'Clés EmailJS manquantes dans les variables d environnement',
      'EMAILJS_CONFIG_MISSING',
    );
  }

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: dto.to,
        to_name: dto.name,
        from_name: 'i.fleur',
        customer_name: dto.customer_name,
        size: dto.size,
        color: dto.color,
        vase: dto.vase,
        message: dto.message,
        isPickup: dto.isPickup,
        isHome: dto.isHome,
        pickup_date: dto.pickup_date,
        delivery_date: dto.delivery_date,
        recipient_name: dto.recipient_name,
        recipient_phone: dto.recipient_phone,
        recipient_address: dto.recipient_address,
        recipient_city: dto.recipient_city,
        quartier: dto.quartier,
        delivery_fee: dto.delivery_fee,
        billing_name: dto.billing_name,
        billing_phone: dto.billing_phone,
        billing_email: dto.billing_email,
        payment_method: dto.payment_method,
        total: dto.total,
      },
      {
        publicKey: EMAILJS_PUBLIC_KEY,
        privateKey: EMAILJS_PRIVATE_KEY,
      },
    );
  } catch (err) {
    if (err instanceof EmailJSResponseStatus) {
      throw new AppError(
        502,
        `EmailJS a refusé l envoi : ${err.text}`,
        'EMAILJS_REJECTED',
      );
    }

    throw new AppError(
      500,
      'Échec de l envoi de l email',
      'EMAIL_SEND_FAILED',
    );
  }
}
