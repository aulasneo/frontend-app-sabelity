const messages = {
  billingNav: {
    id: 'nav.billing',
    defaultMessage: 'Billing',
    description: 'Sidebar nav item for Billing',
  },
  billingTitle: {
    id: 'billing.title',
    defaultMessage: 'Billing',
    description: 'Billing page title',
  },
  billingHistoryTitle: {
    id: 'billing.history.title',
    defaultMessage: 'Payment history',
    description: 'Billing history page title',
  },
  billingHistoryLoading: {
    id: 'billing.history.loading',
    defaultMessage: 'Loading billing history...',
    description: 'Loading message for billing history',
  },
  billingHistoryError: {
    id: 'billing.history.error',
    defaultMessage: 'There was an error loading billing history.',
    description: 'Error message for billing history',
  },
  billingHistoryEmpty: {
    id: 'billing.history.empty',
    defaultMessage: 'No past invoices found.',
    description: 'Shown when there is no billing history',
  },
  billingHistoryColDate: {
    id: 'billing.history.col.date',
    defaultMessage: 'Date',
    description: 'Billing history column: date',
  },
  billingHistoryColSubscription: {
    id: 'billing.history.col.subscription',
    defaultMessage: 'Subscription',
    description: 'Billing history column: subscription/plan name',
  },
  billingHistoryColBillingCycle: {
    id: 'billing.history.col.billingCycle',
    defaultMessage: 'Billing cycle',
    description: 'Billing history column: billing cycle',
  },
  billingHistoryColPeriod: {
    id: 'billing.history.col.period',
    defaultMessage: 'Period',
    description: 'Billing history column: period',
  },
  billingHistoryColAmount: {
    id: 'billing.history.col.amount',
    defaultMessage: 'Amount',
    description: 'Billing history column: amount',
  },
  billingHistoryColStatus: {
    id: 'billing.history.col.status',
    defaultMessage: 'Status',
    description: 'Billing history column: status',
  },
  billingHistoryColInvoice: {
    id: 'billing.history.col.invoice',
    defaultMessage: 'Invoice',
    description: 'Billing history column: invoice link',
  },
  billingHistoryMonthTotal: {
    id: 'billing.history.monthTotal',
    defaultMessage: 'Total billed in {month}:',
    description: 'Label for total billed in a month',
  },
  billingHistoryInvoiceDownload: {
    id: 'billing.history.invoice.download',
    defaultMessage: 'View invoice PDF',
    description: 'Aria label for invoice PDF link',
  },
  billingHistorySearchPlaceholder: {
    id: 'billing.history.search.placeholder',
    defaultMessage: 'Search by subscription or status',
    description: 'Placeholder for billing history search input',
  },
  billingHistoryPaginationPageOf: {
    id: 'billing.history.pagination.pageOf',
    defaultMessage: 'Page {page} of {total}',
    description: 'Label for pagination page info',
  },
  billingHistoryPaginationPrev: {
    id: 'billing.history.pagination.prev',
    defaultMessage: 'Previous',
    description: 'Label for previous page button',
  },
  billingHistoryPaginationNext: {
    id: 'billing.history.pagination.next',
    defaultMessage: 'Next',
    description: 'Label for next page button',
  },
  billingHistoryBackToSubscription: {
    id: 'billing.history.back',
    defaultMessage: 'Back to subscription',
    description: 'Button to go back to Billing page from history',
  },
  status: {
    id: 'billing.subscription.status',
    defaultMessage: 'Status',
    description: 'Subscription status label',
  },
  nextBilling: {
    id: 'billing.subscription.next',
    defaultMessage: 'Next billing',
    description: 'Next billing date label',
  },
  currentPeriodStart: {
    id: 'billing.subscription.current.start',
    defaultMessage: 'Current period start',
    description: 'Current period start date label',
  },
  noActiveSubscription: {
    id: 'billing.subscription.none',
    defaultMessage: 'No active subscription.',
    description: 'Shown when user has no active subscription',
  },
  invoicesTitle: {
    id: 'billing.invoices.title',
    defaultMessage: 'Invoices',
    description: 'Invoices section title',
  },
  loading: {
    id: 'billing.loading',
    defaultMessage: 'Loading...',
    description: 'Generic loading',
  },
  loadingInvoices: {
    id: 'billing.loading.invoices',
    defaultMessage: 'Loading invoices...',
    description: 'Loading invoices',
  },
  noInvoices: {
    id: 'billing.invoices.none',
    defaultMessage: 'No invoices found.',
    description: 'No invoices found',
  },
  view: {
    id: 'billing.invoices.view',
    defaultMessage: 'View',
    description: 'View hosted invoice link',
  },
  pdf: {
    id: 'billing.invoices.pdf',
    defaultMessage: 'PDF',
    description: 'PDF link label',
  },
  upcomingNone: {
    id: 'billing.upcoming.none',
    defaultMessage: 'No upcoming invoice for this subscription.',
    description: 'Shown when there is no upcoming invoice',
  },
  viewHistory: {
    id: 'billing.viewHistory',
    defaultMessage: 'View payment history',
    description: 'Button to navigate to billing history page',
  },
};

export default messages;
