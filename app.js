
(function () {

    const cardGrid = document.getElementById('cardGrid');
    const debugInfo = document.getElementById('debugInfo');
    const filters = document.getElementById('filters');
    const managerFilter = document.getElementById('managerFilter');
    const priceSort = document.getElementById('priceSort');

    let allCampaigns = [];


    // =========================================================
    // JALALI DATE
    // =========================================================

    function getTodayJalali() {

        try {

            const now = new persianDate();

            return {
                year: now.year(),
                month: now.month(),
                day: now.date()
            };

        } catch (e) {

            console.warn('Failed to get Jalali date:', e);

            return null;
        }
    }


    function parseJalaliDate(value) {

        if (!value) return null;

        const str = String(value).trim();

        const parts = str.split(/[\/\-.]/);

        if (parts.length !== 3) {
            return null;
        }

        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);

        if (
            isNaN(year) ||
            isNaN(month) ||
            isNaN(day)
        ) {
            return null;
        }

        if (
            year >= 1300 &&
            year <= 1500 &&
            month >= 1 &&
            month <= 12 &&
            day >= 1 &&
            day <= 31
        ) {

            return {
                year,
                month,
                day
            };
        }

        return null;
    }


    function compareJalaliDates(date1, date2) {

        if (!date1 || !date2) {
            return 0;
        }

        if (date1.year !== date2.year) {
            return date1.year - date2.year;
        }

        if (date1.month !== date2.month) {
            return date1.month - date2.month;
        }

        return date1.day - date2.day;
    }


    function getStatus(startDate, endDate) {

        const today = getTodayJalali();

        if (!today) {

            return {
                label: 'Active',
                className: 'status-active'
            };
        }

        const start = parseJalaliDate(startDate);
        const end = parseJalaliDate(endDate);


        if (!start && !end) {

            return {
                label: 'Active',
                className: 'status-active'
            };
        }


        if (!end) {

            if (
                start &&
                compareJalaliDates(start, today) <= 0
            ) {

                return {
                    label: 'Active',
                    className: 'status-active'
                };
            }

            if (
                start &&
                compareJalaliDates(start, today) > 0
            ) {

                return {
                    label: 'Upcoming',
                    className: 'status-soon'
                };
            }

            return {
                label: 'Active',
                className: 'status-active'
            };
        }


        if (!start) {

            if (
                compareJalaliDates(end, today) >= 0
            ) {

                return {
                    label: 'Active',
                    className: 'status-active'
                };
            }

            return {
                label: 'Expired',
                className: 'status-expired'
            };
        }


        if (
            compareJalaliDates(start, today) <= 0 &&
            compareJalaliDates(end, today) >= 0
        ) {

            return {
                label: 'Active',
                className: 'status-active'
            };
        }


        if (
            compareJalaliDates(start, today) > 0
        ) {

            return {
                label: 'Upcoming',
                className: 'status-soon'
            };
        }


        return {
            label: 'Expired',
            className: 'status-expired'
        };
    }


    // =========================================================
    // PRICE
    // =========================================================

    function parsePrice(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return 0;
        }

        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : 0;
        }

        let str = String(value).trim();

        if (!str) {
            return 0;
        }


        // Persian / Arabic digits → English digits

        str = str
            .replace(/[۰-۹]/g, d =>
                '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)
            )
            .replace(/[٠-٩]/g, d =>
                '٠١٢٣٤٥٦٧٨٩'.indexOf(d)
            );


        // Remove commas and spaces

        str = str
            .replace(/,/g, '')
            .replace(/\s/g, '');


        // Keep only digits, decimal point and minus

        str = str.replace(/[^\d.-]/g, '');


        const number = Number(str);

        return Number.isFinite(number) ? number : 0;
    }


    function formatPrice(value) {

        const price = parsePrice(value);

        if (!price || price <= 0) {
            return '—';
        }

        const millions = price / 1000000;

        // Whole millions → 75M
        if (Number.isInteger(millions)) {
            return `${millions}M`;
        }

        // Decimal millions → 75.5M
        return `${parseFloat(millions.toFixed(2))}M`;
    }


    // =========================================================
    // FIND EXCEL COLUMN
    // =========================================================

    function getColumnValue(row, columnName) {

        if (!row || typeof row !== 'object') {
            return '';
        }


        // Exact match first

        if (
            Object.prototype.hasOwnProperty.call(
                row,
                columnName
            )
        ) {

            return row[columnName];
        }


        // Case / whitespace insensitive match

        const target =
            String(columnName)
                .trim()
                .toLowerCase();


        const key =
            Object.keys(row).find(key =>
                String(key)
                    .trim()
                    .toLowerCase() === target
            );


        if (key !== undefined) {
            return row[key];
        }


        return '';
    }


    // =========================================================
    // FILTERS
    // =========================================================

    function populateManagerFilter(data) {

        const managers = [
            ...new Set(
                data
                    .map(row =>
                        String(
                            getColumnValue(
                                row,
                                'Account Manager'
                            ) || ''
                        ).trim()
                    )
                    .filter(Boolean)
            )
        ];

        managers.sort((a, b) =>
            a.localeCompare(b)
        );


        managerFilter.innerHTML =
            '<option value="all">All</option>';


        managers.forEach(manager => {

            const option =
                document.createElement('option');

            option.value = manager;
            option.textContent = manager;

            managerFilter.appendChild(option);
        });
    }


    function applyFilters() {

        let filtered = [...allCampaigns];

        const selectedManager =
            managerFilter.value;

        const selectedSort =
            priceSort.value;


        if (selectedManager !== 'all') {

            filtered = filtered.filter(row =>

                String(
                    getColumnValue(
                        row,
                        'Account Manager'
                    ) || ''
                ).trim() === selectedManager

            );
        }


        if (selectedSort === 'asc') {

            filtered.sort((a, b) =>

                parsePrice(
                    getColumnValue(a, 'Price')
                ) -

                parsePrice(
                    getColumnValue(b, 'Price')
                )

            );
        }


        if (selectedSort === 'desc') {

            filtered.sort((a, b) =>

                parsePrice(
                    getColumnValue(b, 'Price')
                ) -

                parsePrice(
                    getColumnValue(a, 'Price')
                )

            );
        }


        renderCards(filtered);
    }


    managerFilter.addEventListener(
        'change',
        applyFilters
    );

    priceSort.addEventListener(
        'change',
        applyFilters
    );


    // =========================================================
    // RENDER CARDS
    // =========================================================

    function renderCards(data) {

        if (!data || data.length === 0) {

            cardGrid.innerHTML = `

                <div class="empty-state">

                    <strong>
                        📭 No campaigns found
                    </strong>

                    <br>

                    <span style="font-size:0.8rem;">
                        No campaigns match the selected filters.
                    </span>

                </div>

            `;

            return;
        }


        let html = '';


        data.forEach(row => {

            const name =
                getColumnValue(
                    row,
                    'Campaign Name'
                ) || 'Untitled';


            const banner =
                getColumnValue(
                    row,
                    'Banner'
                ) || '';


            const startRaw =
                getColumnValue(
                    row,
                    'Start Date'
                ) || '';


            const endRaw =
                getColumnValue(
                    row,
                    'End Date'
                ) || '';


            const manager =
                getColumnValue(
                    row,
                    'Account Manager'
                ) || '—';


            // IMPORTANT:
            // Price is read independently from Excel

            const price =
                getColumnValue(
                    row,
                    'Price'
                );


            const status =
                getStatus(
                    startRaw,
                    endRaw
                );


            const startStr =
                startRaw
                    ? String(startRaw).trim()
                    : '—';


            const endStr =
                endRaw
                    ? String(endRaw).trim()
                    : '—';


            // =================================================
            // BANNER URL
            // =================================================

            let imgSrc = '';


            if (banner) {

                const bannerString =
                    String(banner);


                const match =
                    bannerString.match(
                        /src=["']([^"']+)["']/i
                    );


                if (
                    match &&
                    match[1]
                ) {

                    imgSrc = match[1];

                } else if (

                    bannerString.startsWith('http') ||

                    bannerString.startsWith('data:image')

                ) {

                    imgSrc = bannerString;
                }
            }


            html += `

                <div class="card">

                    <div class="card-image">

                        ${
                            imgSrc

                            ?

                            `<img
                                src="${imgSrc}"
                                alt="${name}"
                                loading="lazy"
                                onerror="this.parentElement.innerHTML='<div class=&quot;placeholder-img&quot;>🖼️</div>'"
                            >`

                            :

                            `<div class="placeholder-img">
                                🖼️
                            </div>`
                        }

                    </div>


                    <div
                        class="card-name"
                        title="${name}"
                    >
                        ${name}
                    </div>


                    <div class="card-dates">

                        <div class="date-range">

                            <span class="date-badge">
                                📅 ${startStr}
                            </span>

                            <span class="arrow">
                                —
                            </span>

                            <span class="date-badge">
                                📅 ${endStr}
                            </span>

                        </div>


                        <div
                            class="status-text ${status.className}"
                        >

                            <span class="status-indicator"></span>

                            ${status.label}

                        </div>

                    </div>


                    <div class="card-meta">

                        <div class="card-manager">

                            <span class="meta-label">
                                👤
                            </span>

                            <span
                                class="meta-value"
                                title="${manager}"
                            >
                                ${manager}
                            </span>

                        </div>


                        <div class="card-price">

                            <span class="meta-label">
                                💰
                            </span>

                            <span class="meta-value">
                                ${formatPrice(price)}
                            </span>

                        </div>

                    </div>

                </div>

            `;
        });


        cardGrid.innerHTML = html;
    }


    // =========================================================
    // LOAD EXCEL
    // =========================================================

    function loadExcelFile() {

        debugInfo.textContent =
            '⏳ Loading Campaigns_Master.xlsx...';

        debugInfo.className =
            'debug-info';


        fetch('Campaigns_Master.xlsx')

            .then(response => {

                if (!response.ok) {

                    throw new Error(
                        `File not found (${response.status})`
                    );
                }

                return response.arrayBuffer();
            })


            .then(arrayBuffer => {

                const workbook =
                    XLSX.read(
                        arrayBuffer,
                        {
                            type: 'array'
                        }
                    );


                const firstSheet =
                    workbook.Sheets[
                        workbook.SheetNames[0]
                    ];


                const json =
                    XLSX.utils.sheet_to_json(
                        firstSheet,
                        {
                            defval: ''
                        }
                    );


                if (!json.length) {

                    debugInfo.textContent =
                        '⚠️ Excel file is empty';

                    debugInfo.className =
                        'debug-info error';

                    renderCards([]);

                    return;
                }


                // =================================================
                // NORMALIZE
                // =================================================

                const normalized =
                    json.map(row => {

                        return {

                            'Campaign Name':
                                getColumnValue(
                                    row,
                                    'Campaign Name'
                                ),

                            'Banner Name':
                                getColumnValue(
                                    row,
                                    'Banner Name'
                                ),

                            'Merchant':
                                getColumnValue(
                                    row,
                                    'Merchant'
                                ),

                            'Banner':
                                getColumnValue(
                                    row,
                                    'Banner'
                                ),

                            'Start Date':
                                getColumnValue(
                                    row,
                                    'Start Date'
                                ),

                            'End Date':
                                getColumnValue(
                                    row,
                                    'End Date'
                                ),

                            'Account Manager':
                                getColumnValue(
                                    row,
                                    'Account Manager'
                                ),

                            'Price':
                                getColumnValue(
                                    row,
                                    'Price'
                                )

                        };

                    });


                allCampaigns =
                    normalized;


                populateManagerFilter(
                    allCampaigns
                );


                filters.style.display =
                    'flex';


                const today =
                    getTodayJalali();


                if (today) {

                    debugInfo.textContent =
                        `✅ Loaded ${normalized.length} campaigns | Today: ${today.year}/${today.month}/${today.day}`;

                } else {

                    debugInfo.textContent =
                        `✅ Loaded ${normalized.length} campaigns`;
                }


                debugInfo.className =
                    'debug-info success';


                renderCards(
                    allCampaigns
                );

            })


            .catch(err => {

                console.error(
                    'Banner Monitor error:',
                    err
                );


                debugInfo.textContent =
                    `❌ ${err.message}`;

                debugInfo.className =
                    'debug-info error';


                cardGrid.innerHTML = `

                    <div class="error-state">

                        <strong>
                            ❌ Could not load Excel file
                        </strong>

                        <br><br>

                        Make sure
                        Campaigns_Master.xlsx
                        is beside index.html.

                        <br><br>

                        <span style="font-size:0.7rem;">
                            ${err.message}
                        </span>

                    </div>

                `;

            });

    }


    // =========================================================
    // START
    // =========================================================

    loadExcelFile();

})();
