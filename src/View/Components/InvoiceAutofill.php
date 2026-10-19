<?php

declare(strict_types=1);

namespace Ironshashwat\InvoiceAutofill\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class InvoiceAutofill extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct(
        public ?string $fileInputId = null,
        public ?string $numberInputId = null,
        public ?string $dateInputId = null,
        public ?string $amountInputId = null,
        public ?string $feedbackContainerId = null,
        public ?string $nonce = null,
        public ?string $assetsPath = null
    ) {
        $this->fileInputId ??= config('invoice-autofill.file_input_id', 'invoice_copy');
        $this->numberInputId ??= config('invoice-autofill.number_input_id', 'invoice_number');
        $this->dateInputId ??= config('invoice-autofill.date_input_id', 'invoice_date');
        $this->amountInputId ??= config('invoice-autofill.amount_input_id', 'invoice_amount');
        $this->feedbackContainerId ??= config('invoice-autofill.feedback_container_id', 'autofill_feedback');
        $this->assetsPath ??= config('invoice-autofill.assets_path', '/vendor/invoice-autofill');
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('invoice-autofill::components.invoice-autofill');
    }
}
