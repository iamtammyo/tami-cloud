import { ExchangeRateModel } from '../models/ExchangeRate';
import { format } from 'date-fns';

/**
 * Exchange Rate Service
 * Manages currency conversion rates between NGN, USD, GBP, and EUR
 */
export class ExchangeRateService {
  /**
   * Fetches latest exchange rates from an external API
   * You can use free APIs like:
   * - https://exchangerate-api.com
   * - https://fixer.io
   * - https://currencyapi.com
   */
  static async fetchLatestRates(): Promise<void> {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
      console.warn('EXCHANGE_RATE_API_KEY not set. Using default rates.');
      // Set default rates if no API key (approximate rates)
      const today = format(new Date(), 'yyyy-MM-dd');
      const defaultRates = {
        'USD-NGN': 1500,
        'USD-GBP': 0.79,
        'USD-EUR': 0.92,
        'GBP-NGN': 1900,
        'GBP-EUR': 1.16,
        'EUR-NGN': 1630,
      };

      // Create rates for all currency pairs
      Object.entries(defaultRates).forEach(([pair, rate]) => {
        const [from, to] = pair.split('-');
        ExchangeRateModel.create({
          from_currency: from,
          to_currency: to,
          rate,
          date: today,
        });
        // Create reverse rate
        ExchangeRateModel.create({
          from_currency: to,
          to_currency: from,
          rate: 1 / rate,
          date: today,
        });
      });

      console.log('Using default exchange rates');
      return;
    }

    try {
      // Fetch rates with USD as base
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      );

      const data = await response.json() as any;

      if (data.result === 'success') {
        const today = format(new Date(), 'yyyy-MM-dd');
        const rates = data.conversion_rates as any;

        // Store all relevant currency pairs
        const currencies = ['NGN', 'GBP', 'EUR'];

        currencies.forEach(currency => {
          if (rates[currency]) {
            // USD to other currency
            ExchangeRateModel.create({
              from_currency: 'USD',
              to_currency: currency,
              rate: rates[currency],
              date: today,
            });

            // Other currency to USD
            ExchangeRateModel.create({
              from_currency: currency,
              to_currency: 'USD',
              rate: 1 / rates[currency],
              date: today,
            });
          }
        });

        // Cross rates (NGN-GBP, NGN-EUR, GBP-EUR, etc.)
        if (rates.NGN && rates.GBP) {
          const ngnToGbp = rates.GBP / rates.NGN;
          ExchangeRateModel.create({
            from_currency: 'NGN',
            to_currency: 'GBP',
            rate: ngnToGbp,
            date: today,
          });
          ExchangeRateModel.create({
            from_currency: 'GBP',
            to_currency: 'NGN',
            rate: 1 / ngnToGbp,
            date: today,
          });
        }

        if (rates.NGN && rates.EUR) {
          const ngnToEur = rates.EUR / rates.NGN;
          ExchangeRateModel.create({
            from_currency: 'NGN',
            to_currency: 'EUR',
            rate: ngnToEur,
            date: today,
          });
          ExchangeRateModel.create({
            from_currency: 'EUR',
            to_currency: 'NGN',
            rate: 1 / ngnToEur,
            date: today,
          });
        }

        if (rates.GBP && rates.EUR) {
          const gbpToEur = rates.EUR / rates.GBP;
          ExchangeRateModel.create({
            from_currency: 'GBP',
            to_currency: 'EUR',
            rate: gbpToEur,
            date: today,
          });
          ExchangeRateModel.create({
            from_currency: 'EUR',
            to_currency: 'GBP',
            rate: 1 / gbpToEur,
            date: today,
          });
        }

        console.log('Exchange rates updated for USD, NGN, GBP, EUR');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  static convert(amount: number, fromCurrency: string, toCurrency: string): number | null {
    return ExchangeRateModel.convert(amount, fromCurrency, toCurrency);
  }

  /**
   * Get latest rate between two currencies
   */
  static getLatestRate(fromCurrency: string, toCurrency: string) {
    return ExchangeRateModel.findLatest(fromCurrency, toCurrency);
  }

  /**
   * Get normalized amount in base currency
   * Useful for aggregating transactions in different currencies
   */
  static normalizeToBaseCurrency(
    amount: number,
    currency: string,
    baseCurrency: string = 'NGN'
  ): number {
    if (currency === baseCurrency) return amount;

    const converted = this.convert(amount, currency, baseCurrency);
    return converted || amount;
  }
}
