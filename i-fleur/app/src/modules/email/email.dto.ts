export interface SendEmailDto {
  to: string
  name: string
  customer_name: string
  size: string
  color: string
  vase: string
  message: string
  isPickup: boolean
  isHome: boolean
  pickup_date: string
  delivery_date: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  recipient_city: string
  quartier: string
  delivery_fee: string
  billing_name: string
  billing_phone: string
  billing_email: string
  payment_method: string
  total: string
}
