# Laravel Invoice PDF Auto-Fill

[![Latest Version on Packagist](https://img.shields.io/packagist/v/ironshashwat/laravel-invoice-autofill.svg?style=flat-square)](https://packagist.org/packages/ironshashwat/laravel-invoice-autofill)
[![Total Downloads](https://img.shields.io/packagist/dt/ironshashwat/laravel-invoice-autofill.svg?style=flat-square)](https://packagist.org/packages/ironshashwat/laravel-invoice-autofill)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![PHP Version](https://img.shields.io/badge/php-8.1%2B-8892BF.svg?style=flat-square)](https://php.net)
[![Laravel Version](https://img.shields.io/badge/laravel-10%20%7C%2011%20%7C%2012-FF2D20.svg?style=flat-square)](https://laravel.com)

Instant, client-side PDF invoice text parsing and form auto-fill for Laravel applications. Automatically extracts **Invoice Date**, **Invoice Number**, and **Invoice Amount / Taxable Value** directly in the user's browser with **zero server overhead, no external API latency, and 100% privacy**.

---

## ⚡ Features

- **🚀 Instant & Client-Side**: Uses bundled Mozilla PDF.js to extract text streams directly in the user's browser (<300ms).
- **🔒 Privacy First**: PDF documents never need to be sent to external third-party OCR services.
- **🇮🇳 Multi-Format Invoice Parsing**:
  - **Invoice Date**: Handles standard Indian formats (`DD/MM/YYYY`, `DD-MM-YYYY`), alphanumeric (`15-Oct-2026`), and ISO (`YYYY-MM-DD`).
  - **Invoice Number**: Automatically captures invoice/bill numbers with complex prefixes (e.g. `INV/2026-27/0042`, `ROCA-8891`).
  - **Invoice Amount**: Prioritizes `Taxable Value` / `Sub Total` (vital for Indian GST accounting) with fallback to `Total Amount` / `Grand Total`.
- **🛡️ Progressive Enhancement**: Non-blocking. Gracefully falls back to standard manual input if the uploaded file is a scanned image PDF.
- **🎨 Visual Feedback**: Subtle green highlights and confirmation badges (`Auto-filled`, `Edited`) so users always stay in control.
- **📦 Zero Third-Party CDN Dependency**: Bundles offline-ready assets with full Content Security Policy (CSP) support.

---

## 📥 Installation

Require the package via Composer:

```bash
composer require ironshashwat/laravel-invoice-autofill
```

Publish the static JavaScript assets (`pdf.min.js`, `pdf.worker.min.js`, and `invoice-autofill.js`):

```bash
php artisan vendor:publish --tag=invoice-autofill-assets
```

*(Optional)* Publish the configuration file:

```bash
php artisan vendor:publish --tag=invoice-autofill-config
```

*(Optional)* Publish the Blade component views:

```bash
php artisan vendor:publish --tag=invoice-autofill-views
```

---

## 💻 Usage

### 1. In your Blade View

Simply include the `<x-invoice-autofill />` component at the bottom of your invoice upload form:

```blade
<form id="upload_invoice_form" action="/invoices/upload" method="POST" enctype="multipart/form-data">
    @csrf

    <!-- File Input -->
    <input type="file" id="invoice_copy" name="invoice_copy" accept=".pdf" required>

    <!-- Invoice Fields to Auto-Fill -->
    <input type="text" id="invoice_number" name="invoice_number" required>
    <input type="date" id="invoice_date" name="invoice_date" required>
    <input type="number" id="invoice_amount" name="invoice_amount" required>

    <button type="submit">Upload</button>
</form>

<!-- Include Component -->
<x-invoice-autofill />
```

### 2. Custom Input IDs

If your form uses different element IDs:

```blade
<x-invoice-autofill 
    file-input-id="my_pdf_file"
    number-input-id="my_invoice_no"
    date-input-id="my_invoice_date"
    amount-input-id="my_taxable_amount"
    :nonce="$csp_nonce ?? null"
/>
```

Or using the Blade directive:

```blade
@invoiceAutofill([
    'fileInputId' => 'my_pdf_file',
    'numberInputId' => 'my_invoice_no',
])
```

---

## 🛡️ Content Security Policy (CSP)

If your application enforces strict CSP headers, ensure your `worker-src` directive allows `'self'` and `blob:`:

```http
Content-Security-Policy: ... worker-src 'self' blob:; ...
```

---

## ⚙️ Configuration

The published `config/invoice-autofill.php` allows you to customize default IDs and scan behavior:

```php
return [
    'file_input_id' => 'invoice_copy',
    'number_input_id' => 'invoice_number',
    'date_input_id' => 'invoice_date',
    'amount_input_id' => 'invoice_amount',
    'feedback_container_id' => 'autofill_feedback',
    'max_pages_to_scan' => 2,
    'assets_path' => '/vendor/invoice-autofill',
];
```

---

## 🧪 Testing

```bash
composer test
```

---

## 👤 Author

- **Shashwat Mishra** - [GitHub (@ironshashwat)](https://github.com/ironshashwat)

---

## 📄 License

The MIT License (MIT). Please see [License File](LICENSE) for more information.
