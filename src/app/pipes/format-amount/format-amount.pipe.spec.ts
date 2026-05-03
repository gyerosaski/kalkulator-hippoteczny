import { FormatAmountPipe } from './format-amount.pipe';

describe('FormatAmountPipe', () => {
  it('create an instance', () => {
    const pipe = new FormatAmountPipe();
    expect(pipe).toBeTruthy();
  });
});
