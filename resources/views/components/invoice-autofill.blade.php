@props([
    'fileInputId' => config('invoice-autofill.file_input_id', 'invoice_copy'),
    'numberInputId' => config('invoice-autofill.number_input_id', 'invoice_number'),
    'dateInputId' => config('invoice-autofill.date_input_id', 'invoice_date'),
    'amountInputId' => config('invoice-autofill.amount_input_id', 'invoice_amount'),
    'feedbackContainerId' => config('invoice-autofill.feedback_container_id', 'autofill_feedback'),
    'nonce' => null,
    'assetsPath' => config('invoice-autofill.assets_path', '/vendor/invoice-autofill'),
])

<script {{ !empty($nonce) ? 'nonce=' . $nonce : '' }} src="{{ asset(trim($assetsPath, '/') . '/pdf/pdf.min.js') }}"></script>
<script {{ !empty($nonce) ? 'nonce=' . $nonce : '' }} src="{{ asset(trim($assetsPath, '/') . '/invoice-autofill.js') }}"></script>

<style {{ !empty($nonce) ? 'nonce=' . $nonce : '' }}>
    .autofill-badge {
        font-weight: 500;
        letter-spacing: 0.3px;
        transition: all 0.3s ease;
    }
</style>

<script {{ !empty($nonce) ? 'nonce=' . $nonce : '' }}>
    document.addEventListener('DOMContentLoaded', function() {
        if (window.InvoiceAutoFill) {
            window.InvoiceAutoFill.init({
                pdfWorkerUrl: "{{ asset(trim($assetsPath, '/') . '/pdf/pdf.worker.min.js') }}"
            });
            window.InvoiceAutoFill.bind({
                fileInputId: "{{ $fileInputId }}",
                numberInputId: "{{ $numberInputId }}",
                dateInputId: "{{ $dateInputId }}",
                amountInputId: "{{ $amountInputId }}",
                feedbackContainerId: "{{ $feedbackContainerId }}"
            });
        }
    });
</script>
