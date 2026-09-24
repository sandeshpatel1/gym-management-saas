// Tiny event bus so any part of the app (an axios interceptor, a branch
// switcher click, the "All Branches" overview) can trigger the same
// "this gym is deactivated" popup without needing to be inside a React
// component tree or pass callbacks around. DeactivatedGymModal.jsx is the
// single listener that renders it.
const EVENT_NAME = 'gym:deactivated-notice';

export const notifyDeactivatedGym = (message) => {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { message } }));
};

export const DEACTIVATED_GYM_EVENT = EVENT_NAME;