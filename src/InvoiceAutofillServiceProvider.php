<?php

declare(strict_types=1);

namespace Ironshashwat\InvoiceAutofill;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Ironshashwat\InvoiceAutofill\View\Components\InvoiceAutofill;

class InvoiceAutofillServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../config/invoice-autofill.php',
            'invoice-autofill'
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'invoice-autofill');

        Blade::component('invoice-autofill', InvoiceAutofill::class);

        Blade::directive('invoiceAutofill', function (string $expression): string {
            return "<?php echo view('invoice-autofill::components.invoice-autofill', {$expression})->render(); ?>";
        });

        if ($this->app->runningInConsole()) {
            // Publish configuration
            $this->publishes([
                __DIR__ . '/../config/invoice-autofill.php' => config_path('invoice-autofill.php'),
            ], 'invoice-autofill-config');

            // Publish views
            $this->publishes([
                __DIR__ . '/../resources/views' => resource_path('views/vendor/invoice-autofill'),
            ], 'invoice-autofill-views');

            // Publish static JavaScript assets (pdf.js, worker, and invoice-autofill.js)
            $this->publishes([
                __DIR__ . '/../resources/assets/js' => public_path('vendor/invoice-autofill'),
            ], 'invoice-autofill-assets');
        }
    }
}
