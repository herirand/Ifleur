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
        name: dto.name,
        order: dto.order,
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
