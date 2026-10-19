<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Default Element IDs
    |--------------------------------------------------------------------------
    |
    | Default HTML element IDs matched on your invoice upload form.
    |
    */
    'file_input_id' => 'invoice_copy',
    'number_input_id' => 'invoice_number',
    'date_input_id' => 'invoice_date',
    'amount_input_id' => 'invoice_amount',
    'feedback_container_id' => 'autofill_feedback',

    /*
    |--------------------------------------------------------------------------
    | Maximum Pages to Scan
    |--------------------------------------------------------------------------
    |
    | Limits the number of pages to read for invoice header data.
    | Scanning the first 2 pages is sufficient and keeps memory usage low.
    |
    */
    'max_pages_to_scan' => 2,

    /*
    |--------------------------------------------------------------------------
    | Asset Path
    |--------------------------------------------------------------------------
    |
    | Path to published public assets or PDF.js worker.
    |
    */
    'assets_path' => '/vendor/invoice-autofill',
];
