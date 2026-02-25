# Multi-Channel Integration Setup Guide

## 1. Resend Inbound Email Setup

Your Service Desk can automatically receive customer email replies and append them to tickets.

### Setup Steps:

1. **Get Resend Receiving Address**
   - Go to [Resend Dashboard](https://resend.com/emails) → Receiving
   - Your default address is: `anything@[your-domain].resend.app`
   - Or configure a custom domain like `support@thedoggycompany.in`

2. **Configure Webhook in Resend**
   - Go to Resend Dashboard → Webhooks → Add Webhook
   - **Endpoint URL**: `https://your-domain/api/tickets/webhook/resend-inbound`
   - **Events**: Select `email.received`
   - Save and copy the **Webhook Signing Secret**

3. **Add to .env**
   ```
   RESEND_WEBHOOK_SECRET=your_webhook_secret_from_step_2
   ```

4. **Restart Backend**
   ```
   sudo supervisorctl restart backend
   ```

### How It Works:
- Customers can reply to emails from your support address
- Resend forwards the email to your webhook
- The Service Desk automatically:
  - Matches the email to an existing ticket (by subject line, customer email, or ticket ID)
  - Creates a new ticket if no match is found
  - Appends the message to the ticket timeline
  - Sends real-time notification to all connected agents

---

## 2. WhatsApp Business API Setup

Your Service Desk can send and receive WhatsApp messages for seamless customer communication.

### Prerequisites:
- Meta Business Account
- WhatsApp Business Account
- Verified phone number

### Setup Steps:

1. **Go to Meta Business Suite**
   - Visit [business.facebook.com](https://business.facebook.com)
   - Navigate to WhatsApp Manager

2. **Get Your Credentials**
   - **Phone Number ID**: Found in WhatsApp Manager → Phone Numbers
   - **Access Token**: Generate a permanent token in the API Settings
   - **Business Account ID**: Found in WhatsApp Manager settings

3. **Add to .env**
   ```
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
   ```

4. **Configure Webhook in Meta Developer Portal**
   - Go to your app in [developers.facebook.com](https://developers.facebook.com)
   - WhatsApp → Configuration → Webhook
   - **Callback URL**: `https://your-domain/api/whatsapp/webhook`
   - **Verify Token**: `doggy_company_webhook_verify_2025` (already set in .env)
   - Subscribe to: `messages`, `message_status`

5. **Restart Backend**
   ```
   sudo supervisorctl restart backend
   ```

### API Endpoints:
- `GET /api/whatsapp/status` - Check configuration status
- `POST /api/whatsapp/send` - Send text message
- `POST /api/whatsapp/send-template` - Send template message
- `POST /api/whatsapp/send-media` - Send image/document/audio
- `GET /api/whatsapp/templates` - List available templates

### How It Works:
- Incoming WhatsApp messages trigger the webhook
- Messages are automatically added to existing tickets or create new ones
- Agents can reply via the Service Desk
- Real-time notifications alert agents of new messages

---

## 3. Real-time WebSocket Notifications

The Service Desk uses WebSocket (Socket.IO) for instant updates.

### Features:
- 🔔 **New Ticket Alerts**: Toast notification when a ticket is created
- 💬 **New Message Alerts**: Instant notification when customer replies
- 📊 **Live Stats**: Ticket counts update in real-time
- ✍️ **Typing Indicators**: See when other agents are typing

### Connection Status:
- **Green "Live Updates Active"**: WebSocket connected
- **Yellow "Connecting..."**: Attempting to connect

---

## Testing the Setup

### Test Email Webhook:
```bash
curl -X POST https://your-domain/api/tickets/webhook/resend-inbound \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.received",
    "data": {
      "from": "Test User <test@example.com>",
      "to": ["support@thedoggycompany.in"],
      "subject": "[Ticket #TKT-123] Re: My inquiry",
      "text": "This is a test reply from email"
    }
  }'
```

### Test WhatsApp Status:
```bash
curl https://your-domain/api/whatsapp/status
```

### Send Test WhatsApp:
```bash
curl -X POST https://your-domain/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Hello from The Doggy Company!"
  }'
```
