# Crypto Checkout Platform

A Stripe/PayPal-style crypto payment platform where merchants embed payment buttons on their sites, and customers pay via wallets (Solana/EVM). Built in Next.js + TypeScript with a non-custodial flow (funds go directly to merchants’ wallets).

---

## 📐 Architecture

```mermaid
flowchart TD
	A[Merchant Dashboard (Next.js)] -->|Create Button| B[Buttons API]
	B -->|Embed Code| C[Merchant Website]
	subgraph Merchant Site
		C -->|<script src="cdn">| D[Client SDK]
		D -->|Launch Hosted Checkout| E[Checkout App (Next.js)]
	end
	E -->|POST /api/payments/init| F[Payments API]
	F -->|Create PaymentIntent| G[(DB)]
	E <-->|Sign & Send Tx| I[User Wallet]
	I --> J[(Blockchain RPC)]
	J -->|Tx Confirmed| K[Listener Worker]
	K -->|Update DB + Fire Webhook| L[Merchant Server]
```

---

## 📦 Stack

- **Frontend & API:** Next.js (App Router)
- **DB:** MongoDB
- **Queue/Worker:** BullMQ + Redis (for confirmations & webhooks)
- **Blockchain libs:**
  - Solana: `@solana/web3.js`, Solana Pay reference keys
  - EVM: `viem` or `ethers.js`
- **Wallet adapters:**
  - Solana: `@solana/wallet-adapter-react`
  - EVM: `wagmi` + RainbowKit
- **Styles:** Tailwind CSS + shadcn/ui
- **Security:** HMAC signing (buttons, webhooks), idempotency keys

---

## ✅ Feature Checklist

### Merchant Dashboard

- Login/auth (email or wallet)
- Create payment button
- Configure payout address (Solana/EVM)
- Copy embeddable `<script>` snippet
- View payments list & statuses
- Webhook config (URL + secret)

### Embeddable SDK

- Small JS bundle served via CDN
- Auto-render “pay” button
- Validate config via HMAC
- Open hosted checkout in popup/iframe
- Support callbacks (onSuccess, onClose)

### Hosted Checkout

- `/checkout` route with dynamic UI
- Connect wallet (Solana / EVM)
- Show amount, token, merchant details
- Sign & send transaction
- Poll payment status until confirmed

### Payments API

- `/api/payments/init` → create PaymentIntent & return prepared tx
- `/api/payments/:id/status` → status endpoint
- `/api/buttons/:id` → public config fetch
- Webhook delivery → merchant server

### Blockchain Integration

- Solana native SOL payments
- Solana USDC (SPL token) payments
- EVM native ETH payments
- EVM ERC-20 (USDC) payments
- Reference keys (Solana) + tx verification
- Log decoding for ERC-20 transfers

### Worker + Webhooks

- Confirm tx via RPC/WebSocket
- Update DB status → confirmed/failed
- Deliver webhook with signed payload
- Retry failed deliveries with backoff
- Dashboard to replay webhooks

### Production Hardening

- Idempotency keys for payment creation
- Anti-tamper enforcement (server-side)
- Webhook signing & verification
- Rate limits on API
- Observability (structured logs, traces)
- Testnet/devnet sandbox mode

---

## 📂 Project Structure

```
src/
	app/
		dashboard/
			buttons/page.tsx
			payments/page.tsx
			settings/page.tsx
			checkout/page.tsx
		api/
			buttons/[id]/route.ts
			payments/init/route.ts
			payments/[id]/status/route.ts
			webhooks/merchant/route.ts
		components/
			checkout/
				SolanaCheckout.tsx
				EvmCheckout.tsx
		lib/
			db.ts
			payments/
				intents.ts
				solana.ts
				evm.ts
				webhooks.ts
			security/
				hmac.ts
				webhookVerify.ts
```

---

## 🚀 Development Plan

**Phase 1 – Solana MVP**

- Dashboard: button creation with Solana address + fixed amount
- SDK: embed snippet → hosted checkout
- `/api/payments/init`: create intent + return Solana tx (with reference key)
- Wallet adapter integration, sign + send
- RPC poller: confirm tx, verify destination + amount
- Webhook delivery → merchant

**Phase 2 – EVM Support**

- Add viem tx builder for ETH + ERC-20
- Confirm tx by hash, decode transfer logs
- Update checkout UI to toggle chain

**Phase 3 – Hardening**

- Implement idempotency keys
- HMAC signing for embed payloads
- Webhook retries + logs
- Fee extraction (platform fee)
- Analytics dashboard

---

## 🔒 Security Model

- **Non-custodial:** user → merchant wallet directly
- **Server verified:** destination + amount validated on-chain
- **Anti-tamper:** button config signed, server-enforced
- **Webhooks:** signed with HMAC, replay-safe

---

## 🛠️ Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

---

## 📝 License

This project is licensed under the MIT License.
# crypt
