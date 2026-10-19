/**
 * Invoice PDF Auto-Fill & Extraction Utility
 * Extracts Invoice Number, Invoice Date, and Taxable/Invoice Amount directly from PDF files client-side.
 */
(function(window) {
    'use strict';

    const InvoiceAutoFill = {
        config: {
            pdfWorkerUrl: '/js/pdf/pdf.worker.min.js',
            maxPagesToScan: 2
        },

        init: function(options) {
            this.config = Object.assign({}, this.config, options || {});
            if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = this.config.pdfWorkerUrl;
            }
        },

        /**
         * Extract text content from the first N pages of a PDF File object.
         */
        extractTextFromPdf: async function(file) {
            if (!window.pdfjsLib) {
                throw new Error('PDF.js library is not loaded');
            }

            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const pagesToScan = Math.min(pdf.numPages, this.config.maxPagesToScan);
            
            let fullText = '';
            let rawLines = [];

            for (let i = 1; i <= pagesToScan; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Group text tokens roughly by vertical position to reconstruct lines
                const items = textContent.items;
                let currentY = null;
                let currentLine = '';

                for (let j = 0; j < items.length; j++) {
                    const item = items[j];
                    if (!item.str) continue;

                    // A new line if vertical coordinate differs significantly
                    if (currentY !== null && Math.abs(item.transform[5] - currentY) > 5) {
                        if (currentLine.trim()) {
                            rawLines.push(currentLine.trim());
                        }
                        currentLine = item.str;
                    } else {
                        currentLine += (currentLine ? ' ' : '') + item.str;
                    }
                    currentY = item.transform[5];
                }

                if (currentLine.trim()) {
                    rawLines.push(currentLine.trim());
                }
            }

            fullText = rawLines.join('\n');
            return {
                text: fullText,
                lines: rawLines,
                pageCount: pdf.numPages
            };
        },

        /**
         * Month name dictionary for date parsing
         */
        monthMap: {
            'jan': '01', 'january': '01',
            'feb': '02', 'february': '02',
            'mar': '03', 'march': '03',
            'apr': '04', 'april': '04',
            'may': '05',
            'jun': '06', 'june': '06',
            'jul': '07', 'july': '07',
            'aug': '08', 'august': '08',
            'sep': '09', 'sept': '09', 'september': '09',
            'oct': '10', 'october': '10',
            'nov': '11', 'november': '11',
            'dec': '12', 'december': '12'
        },

        /**
         * Normalize various date strings to standard YYYY-MM-DD
         */
        normalizeDate: function(dateStr) {
            if (!dateStr) return null;
            dateStr = dateStr.trim().replace(/^[^\w]+|[^\w]+$/g, '');

            // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD
            let m = dateStr.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
            if (m) {
                const y = m[1];
                const mon = m[2].padStart(2, '0');
                const d = m[3].padStart(2, '0');
                return `${y}-${mon}-${d}`;
            }

            // 2. DD-MMM-YYYY or DD MMM YYYY (e.g. 15-Oct-2025, 05-NOV-2024, 12 Jan 2025)
            m = dateStr.match(/^(\d{1,2})[-\/\s\.]([A-Za-z]{3,9})[-\/\s\.](\d{2,4})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const monKey = m[2].toLowerCase().substring(0, 3);
                let y = m[3];
                if (y.length === 2) y = '20' + y;
                const mon = this.monthMap[monKey];
                if (mon && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
                    return `${y}-${mon}-${d}`;
                }
            }

            // 3. MMM DD, YYYY (e.g. Oct 15, 2025)
            m = dateStr.match(/^([A-Za-z]{3,9})[-\/\s\.](\d{1,2}),?[-\/\s\.](\d{2,4})$/);
            if (m) {
                const monKey = m[1].toLowerCase().substring(0, 3);
                const d = m[2].padStart(2, '0');
                let y = m[3];
                if (y.length === 2) y = '20' + y;
                const mon = this.monthMap[monKey];
                if (mon && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
                    return `${y}-${mon}-${d}`;
                }
            }

            // 4. DD/MM/YYYY or DD-MM-YYYY (Standard Indian / British format)
            m = dateStr.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
            if (m) {
                const d = m[1].padStart(2, '0');
                const mon = m[2].padStart(2, '0');
                let y = m[3];
                if (y.length === 2) y = '20' + y;
                
                const dInt = parseInt(d, 10);
                const monInt = parseInt(mon, 10);
                const yInt = parseInt(y, 10);

                if (monInt >= 1 && monInt <= 12 && dInt >= 1 && dInt <= 31 && yInt >= 2000 && yInt <= 2040) {
                    return `${y}-${mon}-${d}`;
                }
            }

            return null;
        },

        /**
         * Extract Invoice Date
         */
        parseInvoiceDate: function(text, lines) {
            const dateRegexes = [
                // Keyword followed by date
                /(?:invoice\s*date|inv\s*date|inv\.\s*date|date\s*of\s*invoice|bill\s*date|dated?|bill\s*dt)[:\s\-\.]*([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4})/i,
                /(?:invoice\s*date|inv\s*date|inv\.\s*date|date\s*of\s*invoice|bill\s*date|dated?|bill\s*dt)[:\s\-\.]*([0-9]{1,2}[-\/\s][A-Za-z]{3,9}[-\/\s][0-9]{2,4})/i,
                /(?:invoice\s*date|inv\s*date|inv\.\s*date|date\s*of\s*invoice|bill\s*date|dated?|bill\s*dt)[:\s\-\.]*([A-Za-z]{3,9}[-\/\s][0-9]{1,2},?[-\/\s][0-9]{2,4})/i,
                /(?:invoice\s*date|inv\s*date|inv\.\s*date|date\s*of\s*invoice|bill\s*date|dated?|bill\s*dt)[:\s\-\.]*([0-9]{4}[-\/\.][0-9]{1,2}[-\/\.][0-9]{1,2})/i
            ];

            // 1. Try regex on full text
            for (let r of dateRegexes) {
                const match = text.match(r);
                if (match && match[1]) {
                    const normalized = this.normalizeDate(match[1]);
                    if (normalized) return normalized;
                }
            }

            // 2. Scan lines individually for separated labels (e.g. line 1: "Invoice Date", line 2: "15/10/2026")
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (/^(?:invoice\s*date|inv\s*date|bill\s*date|date\s*of\s*invoice)\s*[:\s]*$/i.test(line)) {
                    if (i + 1 < lines.length) {
                        const normalized = this.normalizeDate(lines[i + 1]);
                        if (normalized) return normalized;
                    }
                }
            }

            return null;
        },

        /**
         * Extract Invoice Number
         */
        parseInvoiceNumber: function(text, lines) {
            const numRegexes = [
                // Keyword followed by invoice number
                /(?:invoice\s*no\.?|invoice\s*number|invoice\s*#|inv\s*no\.?|inv\s*#|bill\s*no\.?|bill\s*#)[:\s\-#]*([A-Za-z0-9][A-Za-z0-9\/\-_\.]{1,28}[A-Za-z0-9])/i
            ];

            for (let r of numRegexes) {
                const match = text.match(r);
                if (match && match[1]) {
                    let val = match[1].trim();
                    // Avoid false positives like dates or standard keywords
                    if (!/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(val) && !/^(date|original|duplicate|tax|gst)$/i.test(val)) {
                        return val.toUpperCase();
                    }
                }
            }

            // Check line-by-line in case label is on separate line
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (/^(?:invoice\s*no\.?|invoice\s*number|inv\s*no\.?)\s*[:\s]*$/i.test(line)) {
                    if (i + 1 < lines.length) {
                        const val = lines[i + 1].trim();
                        if (/^[A-Za-z0-9][A-Za-z0-9\/\-_\.]{1,28}[A-Za-z0-9]$/.test(val)) {
                            return val.toUpperCase();
                        }
                    }
                }
            }

            return null;
        },

        /**
         * Extract Invoice Amount / Taxable Value
         * (Priority is given to Taxable Value / Sub Total as per portal instructions)
         */
        parseInvoiceAmount: function(text, lines) {
            // Helper to clean amount string (e.g. "1,45,200.00" -> 145200)
            const parseAmountNumber = (amtStr) => {
                if (!amtStr) return null;
                // remove currency symbols, words, whitespace, and commas (preserve decimal dot)
                amtStr = amtStr.replace(/[₹\s]|INR|Rs\.?/gi, '').replace(/,/g, '').trim();
                const num = parseFloat(amtStr);
                if (!isNaN(num) && num > 0 && num < 1000000000) {
                    return Math.round(num); // portal inputs use step=1 integer
                }
                return null;
            };

            // 1. High priority: Taxable Value / Sub Total / Assessable Value
            const taxableRegexes = [
                /(?:taxable\s*value|taxable\s*amount|total\s*taxable\s*value|sub\s*total|assessable\s*value)[:\s\-\.]*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i
            ];

            for (let r of taxableRegexes) {
                const match = text.match(r);
                if (match && match[1]) {
                    const parsed = parseAmountNumber(match[1]);
                    if (parsed) return parsed;
                }
            }

            // 2. Fallback: Grand Total / Total Invoice Amount / Net Amount
            const totalRegexes = [
                /(?:total\s*invoice\s*amount|total\s*amount|invoice\s*amount|invoice\s*value|net\s*amount|grand\s*total)[:\s\-\.]*(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i
            ];

            for (let r of totalRegexes) {
                const match = text.match(r);
                if (match && match[1]) {
                    const parsed = parseAmountNumber(match[1]);
                    if (parsed) return parsed;
                }
            }

            return null;
        },

        /**
         * Main auto-fill binder
         */
        bind: function(options) {
            const opts = Object.assign({
                fileInputId: 'invoice_copy',
                numberInputId: 'invoice_number',
                dateInputId: 'invoice_date',
                amountInputId: 'invoice_amount',
                feedbackContainerId: 'autofill_feedback'
            }, options);

            const fileInput = document.getElementById(opts.fileInputId);
            if (!fileInput) return;

            const numberInput = document.getElementById(opts.numberInputId);
            const dateInput = document.getElementById(opts.dateInputId);
            const amountInput = document.getElementById(opts.amountInputId);

            // Create or get feedback container
            let feedback = document.getElementById(opts.feedbackContainerId);
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.id = opts.feedbackContainerId;
                feedback.style.marginBottom = '10px';
                feedback.style.display = 'none';
                fileInput.parentNode.appendChild(feedback);
            }

            const showFeedback = (html, type) => {
                feedback.className = `alert alert-${type} py-1 px-2`;
                feedback.style.fontSize = '12px';
                feedback.style.marginTop = '6px';
                feedback.style.borderRadius = '4px';
                feedback.style.display = 'block';
                feedback.innerHTML = html;
            };

            const clearFeedback = () => {
                feedback.style.display = 'none';
                feedback.innerHTML = '';
            };

            // Visual badge helper for fields
            const addFieldBadge = (inputEl, fieldName) => {
                if (!inputEl) return;
                inputEl.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease';
                inputEl.style.borderColor = '#28a745';
                inputEl.style.boxShadow = '0 0 5px rgba(40, 167, 69, 0.4)';

                // Check if existing badge exists
                let badge = inputEl.parentNode.querySelector('.autofill-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'autofill-badge label label-success pull-right';
                    badge.style.fontSize = '10px';
                    badge.style.marginTop = '2px';
                    inputEl.parentNode.insertBefore(badge, inputEl.nextSibling);
                }
                badge.innerHTML = '<i class="fa fa-magic"></i> Auto-filled';

                // Listen for manual edit
                const onEdit = function() {
                    badge.className = 'autofill-badge label label-default pull-right';
                    badge.innerHTML = '<i class="fa fa-pencil"></i> Edited';
                    inputEl.style.borderColor = '';
                    inputEl.style.boxShadow = '';
                    inputEl.removeEventListener('input', onEdit);
                };
                inputEl.addEventListener('input', onEdit);
            };

            fileInput.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if (!file) {
                    clearFeedback();
                    return;
                }

                if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                    clearFeedback();
                    return;
                }

                showFeedback('<i class="fa fa-spinner fa-spin"></i> Reading invoice data from PDF...', 'info');

                try {
                    const result = await InvoiceAutoFill.extractTextFromPdf(file);
                    
                    if (!result.text || result.text.trim().length < 15) {
                        showFeedback('<i class="fa fa-info-circle"></i> Scanned image PDF detected (no embedded text). Please enter details manually.', 'warning');
                        return;
                    }

                    const extractedDate = InvoiceAutoFill.parseInvoiceDate(result.text, result.lines);
                    const extractedNo = InvoiceAutoFill.parseInvoiceNumber(result.text, result.lines);
                    const extractedAmount = InvoiceAutoFill.parseInvoiceAmount(result.text, result.lines);

                    let filledCount = 0;
                    let filledList = [];

                    if (extractedNo && numberInput) {
                        numberInput.value = extractedNo;
                        addFieldBadge(numberInput, 'Invoice Number');
                        filledCount++;
                        filledList.push('Number');
                    }

                    if (extractedDate && dateInput) {
                        dateInput.value = extractedDate;
                        addFieldBadge(dateInput, 'Invoice Date');
                        filledCount++;
                        filledList.push('Date');
                    }

                    if (extractedAmount && amountInput) {
                        amountInput.value = extractedAmount;
                        addFieldBadge(amountInput, 'Invoice Amount');
                        filledCount++;
                        filledList.push('Amount');
                    }

                    if (filledCount > 0) {
                        showFeedback(
                            `<i class="fa fa-check-circle"></i> <strong>Auto-filled:</strong> ${filledList.join(', ')} from invoice copy. Please verify before submitting.`,
                            'success'
                        );
                    } else {
                        showFeedback(
                            '<i class="fa fa-info-circle"></i> Could not automatically detect fields from this PDF layout. Please enter details manually.',
                            'warning'
                        );
                    }
                } catch (err) {
                    console.error('Invoice PDF auto-fill error:', err);
                    showFeedback(
                        '<i class="fa fa-exclamation-triangle"></i> Notice: PDF auto-fill encountered an issue. You can enter details manually.',
                        'warning'
                    );
                }
            });
        }
    };

    window.InvoiceAutoFill = InvoiceAutoFill;
})(window);
