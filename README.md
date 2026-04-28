# Voucher Remittance Application

A production-quality, premium voucher sender page built with Next.js, React, and Tailwind CSS.

## Features

- **Modern UI/UX**: Clean, professional design with smooth animations and microinteractions
- **Payment Methods**: Support for Card, Apple Pay, and Google Pay
- **Responsive Design**: Optimized for both mobile and desktop
- **Premium Background**: Beautiful gradient with blurred blob effects
- **State Management**: React hooks for form handling and UI states
- **Success Flow**: Complete payment simulation with voucher code generation

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** (Functional Components)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Inter Font** for typography

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000/send](http://localhost:3000/send) in your browser

## Project Structure

```
├── app/
│   ├── send/
│   │   └── page.tsx          # Main sender page
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
├── components/
│   ├── Button.tsx            # Reusable button component
│   ├── Card.tsx              # Card container component
│   ├── Input.tsx             # Input field component
│   └── PaymentMethodSelector.tsx  # Payment method selector
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Features Implemented

### ✅ Core Requirements
- [x] Full-page wrapper with min-h-screen
- [x] Hero section with centered content
- [x] Payment card with all form elements
- [x] Success state with voucher code
- [x] Premium gradient background with blobs
- [x] Responsive design (mobile/desktop)

### ✅ Components
- [x] Amount input with $ prefix
- [x] Payment method selector (Card, Apple Pay, Google Pay)
- [x] Conditional card details form
- [x] Pay button with loading state
- [x] Success UI with copy functionality

### ✅ Interactions
- [x] Smooth transitions on all interactive elements
- [x] Button hover and press animations
- [x] Input focus rings
- [x] Loading spinner during payment
- [x] Copy to clipboard functionality

### ✅ Styling
- [x] Inter font family
- [x] Consistent Tailwind spacing
- [x] Rounded corners (rounded-2xl/3xl)
- [x] Soft shadows and premium effects
- [x] Blue/emerald color palette
- [x] Glass morphism effects

## Usage

1. Enter an amount in the input field
2. Select a payment method
3. Fill in card details if "Card" is selected
4. Click "Pay" to simulate payment
5. Receive a voucher code on success
6. Copy the code to share with recipient

## Production Considerations

This is a frontend-only demonstration. In production, you would need:
- Real payment processing integration
- Backend API for voucher generation
- Database for storing voucher codes
- Authentication system
- Error handling and validation
- Security measures for payment processing
