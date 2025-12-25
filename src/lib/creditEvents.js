const CREDIT_UPDATE_EVENT = 'planlyze:credit-update';

export const emitCreditUpdate = () => {
  window.dispatchEvent(new CustomEvent(CREDIT_UPDATE_EVENT));
};

export const onCreditUpdate = (callback) => {
  window.addEventListener(CREDIT_UPDATE_EVENT, callback);
  return () => window.removeEventListener(CREDIT_UPDATE_EVENT, callback);
};
