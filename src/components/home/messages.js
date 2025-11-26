const messages = {
  homeTitle: {
    id: 'home.title',
    defaultMessage: 'Pricing Plans',
    description: 'Main page title',
  },
  homeTitle2: {
    id: 'home.title2',
    defaultMessage: 'Sabelity LMS',
    description: 'Main page subtitle',
  },
  homeDescription: {
    id: 'home.description',
    defaultMessage: 'Choose the plan that best fits your needs.',
    description: 'Main page description',
  },
  homeButtonBack: {
    id: 'home.button.back',
    defaultMessage: 'Back',
    description: 'Back button text',
  },
  featuresTitle: {
    id: 'home.features.title',
    defaultMessage: 'Included in all plans:',
    description: 'Features section title',
  },
  feature1: {
    id: 'home.feature.1',
    defaultMessage: '1, 3, or 10 Courses Published (depending on plan)',
    description: 'Feature 1',
  },
  feature2: {
    id: 'home.feature.2',
    defaultMessage: 'Free or Paid Courses',
    description: 'Feature 2',
  },
  feature3: {
    id: 'home.feature.3',
    defaultMessage: 'Unlimited Students',
    description: 'Feature 3',
  },
  feature4: {
    id: 'home.feature.4',
    defaultMessage: 'Public or Private Access',
    description: 'Feature 4',
  },
  additionalInfo: {
    id: 'home.additional.info',
    defaultMessage: '🎉 Included in All Plans',
    description: 'Additional info section title',
  },
  unlimitedLearnersTitle: {
    id: 'home.additional.unlimited.learners.title',
    defaultMessage: 'Unlimited Learners',
    description: 'Title for unlimited learners feature',
  },
  unlimitedLearnersDesc: {
    id: 'home.additional.unlimited.learners.desc',
    defaultMessage: 'No limits on the number of students',
    description: 'Description for unlimited learners feature',
  },
  zeroCommissionTitle: {
    id: 'home.additional.zero.commission.title',
    defaultMessage: '0% Commission',
    description: 'Title for zero commission feature',
  },
  zeroCommissionDesc: {
    id: 'home.additional.zero.commission.desc',
    defaultMessage: 'Public/private courses, free or paid',
    description: 'Description for zero commission feature',
  },
  homeBasicTitle: {
    id: 'home.basic.title',
    defaultMessage: '1 Course',
    description: 'Basic Subscription',
  },
  homeBasicFeatures: {
    id: 'home.basic.features',
    defaultMessage: 'Basic Subscription - 1 course',
    description: 'Features of Basic Subscription',
  },
  homeBasicDescription: {
    id: 'home.basic.description',
    defaultMessage: 'Perfect starting point for educators and small teams.',
    description: 'Description of Basic Subscription',
  },
  homeBasicPrice: {
    id: 'home.basic.price',
    defaultMessage: 'USD $69',
    description: 'Price of Basic Subscription',
  },
  homeStandardTitle: {
    id: 'home.standard.title',
    defaultMessage: '3 Courses',
    description: 'Standard Subscription',
  },
  homeStandardFeatures: {
    id: 'home.standard.features',
    defaultMessage: 'Standard Subscription - up to 3 courses',
    description: 'Features of Standard Subscription',
  },
  homeStandardDescription: {
    id: 'home.standard.description',
    defaultMessage: 'Ideal for growing course creators and small businesses.',
    description: 'Description of Standard Subscription',
  },
  homeStandardPrice: {
    id: 'home.standard.price',
    defaultMessage: 'USD $149',
    description: 'Price of Standard Subscription',
  },
  homePremiumTitle: {
    id: 'home.premium.title',
    defaultMessage: '10 Courses',
    description: 'Premium Subscription',
  },
  homePremiumFeatures: {
    id: 'home.premium.features',
    defaultMessage: 'Premium Subscription - up to 10 courses',
    description: 'Features of Premium Subscription',
  },
  homePremiumDescription: {
    id: 'home.premium.description',
    defaultMessage: 'Best for organizations with extensive course catalogs.',
    description: 'Description of Premium Subscription',
  },
  homePremiumPrice: {
    id: 'home.premium.price',
    defaultMessage: 'USD $199',
    description: 'Price of Premium Subscription',
  },
  suscripcionActualTitle: {
    id: 'modal.actual.title',
    defaultMessage: 'Your current subscription: ',
    description: 'Title for current subscription',
  },
  suscripcionAnyMessage: {
    id: 'modal.subscription.any.message',
    defaultMessage: 'You currently do not have any active subscription.',
    description: 'Message shown when there is no active subscription',
  },
  homeButtonSendEmail: {
    id: 'home.Button.send.message',
    defaultMessage: 'Contact Us',
    description: 'Button text for contact',
  },
  modalTitle: {
    id: 'home.modalTitle',
    defaultMessage: 'Warning',
    description: 'Title for warning modal',
  },
  modalContent: {
    id: 'home.modalContent',
    defaultMessage: 'If you want to downgrade to {limit} courses, you need to delete {deleteCourses} courses first.',
    description: 'Content for warning modal',
  },
  modalButtonClose: {
    id: 'home.modalButtonClose',
    defaultMessage: 'Cancel',
    description: 'Close button text for modal',
  },
  modalButtonConfirm: {
    id: 'home.modalButtonConfirm',
    defaultMessage: 'Continue',
    description: 'Confirm button text for modal',
  },
  modalExceedsCourses: {
    id: 'home.modalExceedsCourses',
    defaultMessage: 'You currently have {currentCourses} active courses, and your current plan has a limit of {newLimit} courses.',
    description: 'Message for exceeding courses',
  },
  // Cancel subscription flow
  cancelSubscription: {
    id: 'home.cancel.subscription',
    defaultMessage: 'Cancel subscription',
    description: 'Button text to cancel subscription',
  },
  cancellingSubscription: {
    id: 'home.cancelling.subscription',
    defaultMessage: 'Cancelling...'
    ,
    description: 'Button text while cancelling subscription',
  },
  confirmCancelSubscription: {
    id: 'home.confirm.cancel.subscription',
    defaultMessage: 'Are you sure you want to cancel your subscription?',
    description: 'Confirmation message before cancelling subscription',
  },
  cancelSubscriptionSuccess: {
    id: 'home.cancel.subscription.success',
    defaultMessage: 'Your subscription cancellation has been scheduled.',
    description: 'Success message after scheduling cancellation',
  },
  cancelSubscriptionError: {
    id: 'home.cancel.subscription.error',
    defaultMessage: 'There was an error canceling your subscription.',
    description: 'Error message when cancellation fails',
  },
  // Cart flow
  cartButton: {
    id: 'home.cart.button',
    defaultMessage: 'Cart',
    description: 'Shopping cart button',
  },
  cartTitle: {
    id: 'home.cart.title',
    defaultMessage: 'Add subscriptions',
    description: 'Cart modal title',
  },
  cartEmpty: {
    id: 'home.cart.empty',
    defaultMessage: 'Your cart is empty.',
    description: 'Shown when there are no items in the cart',
  },
  checkoutNoUrl: {
    id: 'home.cart.checkout.no.url',
    defaultMessage: 'Checkout created but no URL was returned.',
    description: 'Shown when backend did not return a redirect url',
  },
  cartCheckoutError: {
    id: 'home.cart.checkout.error',
    defaultMessage: 'There was an error initiating the checkout.',
    description: 'Shown when multiple-items checkout fails',
  },
  checkoutButton: {
    id: 'home.cart.checkout.button',
    defaultMessage: 'Checkout',
    description: 'Button label for cart checkout',
  },
  errorTitle: {
    id: 'home.error.title',
    defaultMessage: 'Error',
    description: 'Generic error modal title',
  },
  cartSubtotal: {
    id: 'home.cart.subtotal',
    defaultMessage: 'Subtotal',
    description: 'Subtotal label in cart modal',
  },
  noProducts: {
    id: 'home.cart.no.products',
    defaultMessage: 'No products available.',
    description: 'Shown when there are no products to list in the cart modal',
  },
};

export default messages;
