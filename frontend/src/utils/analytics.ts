type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: 'event' | 'config' | 'js',
      target: string | Date,
      params?: AnalyticsParams,
    ) => void;
  }
}

const hasGtag = () => typeof window !== 'undefined' && typeof window.gtag === 'function';

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!hasGtag()) {
    return;
  }

  window.gtag?.('event', eventName, {
    app_name: 'Eunoia',
    ...params,
  });
};

export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (!hasGtag()) {
    return;
  }

  const pageLocation =
    typeof window !== 'undefined' ? `${window.location.origin}${pagePath}` : pagePath;

  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: pageLocation,
    page_title: pageTitle,
  });
};
