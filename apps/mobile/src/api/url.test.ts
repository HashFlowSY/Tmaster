import { joinApiUrl } from './url';

describe('joinApiUrl', () => {
  it('去除 base 末尾斜杠并补 path 前斜杠', () => {
    expect(joinApiUrl('http://192.168.1.5:8787/', 'api/auth/login')).toBe(
      'http://192.168.1.5:8787/api/auth/login',
    );
  });

  it('base 无斜杠、path 有斜杠也正确', () => {
    expect(joinApiUrl('http://host:8787', '/api/bazi-chart')).toBe('http://host:8787/api/bazi-chart');
  });
});
