# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Structured Logging**: New `createLogger` utility in `x402/shared` for consistent, structured logging across all packages
  - Supports log levels: debug, info, warn, error
  - JSON output mode for production environments
  - Contextual metadata support (component, operation, network, transaction hash, etc.)

- **Shared Middleware Utilities**: New `paymentRequirementsBuilder.ts` with reusable functions:
  - `buildEvmPaymentRequirements()` - Build EVM-specific payment requirements
  - `buildSvmPaymentRequirements()` - Build Solana-specific payment requirements
  - `buildPaymentRequirements()` - Unified builder supporting both networks
  - `isEvmNetwork()` / `isSvmNetwork()` - Network type guards

- **Enhanced CI/CD Pipeline**:
  - Code coverage reporting with Codecov integration
  - Python test coverage in CI
  - CodeQL security scanning for TypeScript and Python
  - Dependency vulnerability auditing with `pnpm audit`

- **Full Solana Paywall Support**: Solana networks now fully supported in browser paywall HTML generation

### Changed

- **Stricter TypeScript Configuration**: Enhanced `tsconfig.base.json` with additional strict checks:
  - `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`
  - `strictBindCallApply`, `strictPropertyInitialization`
  - `noImplicitThis`, `useUnknownInCatchVariables`
  - `noUnusedLocals`, `noUnusedParameters`
  - `noImplicitReturns`, `noFallthroughCasesInSwitch`
  - `noUncheckedIndexedAccess`

### Fixed

- **Security: JSON.parse Error Handling**: All `JSON.parse()` calls now wrapped with proper try-catch blocks:
  - `decodePayment()` in `paymentUtils.ts` - Validates input before parsing
  - `decodeXPaymentResponse()` in `middleware.ts` - Returns typed `PaymentResponse` interface
  - `wrapFetchWithPayment()` in `x402-fetch` - Validates 402 response structure

- **Type Safety Improvements**:
  - Added proper type guards for payment payload validation
  - Improved error messages with specific field validation
  - Fixed `unknown[]` type in fetch wrapper with proper validation

- **Testnet Detection**: Fixed paywall testnet detection to include `solana-devnet` alongside `base-sepolia`

### Removed

- Removed TODO comments that have been addressed
- Removed redundant code duplication between Express and Hono middleware

### Security

- Added CodeQL static analysis security scanning
- Added dependency vulnerability auditing in CI pipeline
- Improved input validation for payment payloads

## [0.7.3] - Previous Release

See Git history for changes prior to changelog adoption.
