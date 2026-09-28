import { Collapsible, getResolvedEasing } from '../Collapsible';

describe('Collapsible component', () => {
  it('exports Collapsible component', () => {
    expect(Collapsible).toBeDefined();
    expect(Collapsible.displayName).toBe('Collapsible');
  });

  it('resolves easing functions and strings properly', () => {
    const customEasing = (t: number) => t;
    expect(getResolvedEasing(customEasing)).toBe(customEasing);
    expect(typeof getResolvedEasing('easeOutCubic')).toBe('function');
    expect(typeof getResolvedEasing('easeInOutQuad')).toBe('function');
    expect(typeof getResolvedEasing('linear')).toBe('function');
    expect(typeof getResolvedEasing(undefined)).toBe('function');
  });
});
