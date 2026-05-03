import { FormatCurrencyAmountPipe } from './format-currency-amount.pipe';

describe('FormatCurrencyAmountPipe', () => {
  it('create an instance', () => {
    const pipe = new FormatCurrencyAmountPipe();
    expect(pipe).toBeTruthy();
  });
});
