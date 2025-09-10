# Crypto Checkout Platform

A Stripe/PayPal-style crypto payment platform where merchants embed payment buttons on their sites, and customers pay via EVM wallets (Ethereum, Polygon, etc.). Built in Next.js + TypeScript with a non-custodial flow (funds go directly to merchants' wallets).

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
	E <-->|Sign & Send Tx| I[EVM Wallet]
	I --> J[(EVM RPC)]
	J -->|Tx Confirmed| K[Listener Worker]
	K -->|Update DB + Fire Webhook| L[Merchant Server]
```

---

## 📦 Stack

- **Frontend & API:** Next.js (App Router)
- **DB:** MongoDB
- **Queue/Worker:** BullMQ + Redis (for confirmations & webhooks)
- **Blockchain libs:**
  - EVM: `viem` or `ethers.js`
- **Wallet adapters:**
  - EVM: `wagmi` + RainbowKit
- **Styles:** Tailwind CSS + shadcn/ui
- **Security:** HMAC signing (buttons, webhooks), idempotency keys

---

## ✅ Feature Checklist

### Merchant Dashboard

- Login/auth (email or wallet)
- Create payment button
- Configure payout address (EVM)
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
- Connect EVM wallet
- Show amount, token, merchant details
- Sign & send transaction
- Poll payment status until confirmed

### Payments API

- `/api/payments/init` → create PaymentIntent & return prepared tx
- `/api/payments/:id/status` → status endpoint
- `/api/buttons/:id` → public config fetch
- Webhook delivery → merchant server

### Blockchain Integration

- EVM native ETH payments
- EVM ERC-20 (USDC, USDT, etc.) payments
- Multi-chain support (Ethereum, Polygon, Arbitrum, etc.)
- Log decoding for ERC-20 transfers
- Transaction verification and confirmation

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
				EvmCheckout.tsx
		lib/
			db.ts
			payments/
				intents.ts
				evm.ts
				webhooks.ts
			security/
				hmac.ts
				webhookVerify.ts
```

---

## 🚀 Development Plan

**Phase 1 – EVM MVP**

- Dashboard: button creation with EVM address + fixed amount
- SDK: embed snippet → hosted checkout
- `/api/payments/init`: create intent + return EVM tx
- Wallet adapter integration (wagmi), sign + send
- RPC poller: confirm tx, verify destination + amount
- Webhook delivery → merchant

**Phase 2 – Multi-Chain Support**

- Add support for multiple EVM chains (Polygon, Arbitrum, etc.)
- Chain selection in checkout UI
- Optimize gas estimation per chain
- Cross-chain payment routing

**Phase 3 – Hardening**

- Implement idempotency keys
- HMAC signing for embed payloads
- Webhook retries + logs
- Fee extraction (platform fee)
- Analytics dashboard

---

## 🔒 Security Model

- **Non-custodial:** user → merchant wallet directly
- **Server verified:** destination + amount validated on-chain via EVM RPC
- **Anti-tamper:** button config signed, server-enforced
- **Webhooks:** signed with HMAC, replay-safe
- **Gas optimization:** smart gas estimation and fee management

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
