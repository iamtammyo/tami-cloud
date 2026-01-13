import { ExchangeRateModel } from '../models/ExchangeRate';
import { format } from 'date-fns';

/**
 * Exchange Rate Service
 * Manages currency conversion rates between NGN and USD
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
      // Set default rates if no API key
      const today = format(new Date(), 'yyyy-MM-dd');
      ExchangeRateModel.create({
        from_currency: 'USD',
        to_currency: 'NGN',
        rate: 1500, // Default rate - should be updated
        date: today,
      });
      ExchangeRateModel.create({
        from_currency: 'NGN',
        to_currency: 'USD',
        rate: 1 / 1500,
        date: today,
      });
      return;
    }

    try {
      // Example with exchangerate-api.com
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      );

      const data = await response.json();

      if (data.result === 'success' && data.conversion_rates.NGN) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const usdToNgn = data.conversion_rates.NGN;

        ExchangeRateModel.create({
          from_currency: 'USD',
          to_currency: 'NGN',
          rate: usdToNgn,
          date: today,
        });

        ExchangeRateModel.create({
          from_currency: 'NGN',
          to_currency: 'USD',
          rate: 1 / usdToNgn,
          date: today,
        });

        console.log(`Exchange rates updated: 1 USD = ${usdToNgn} NGN`);
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
