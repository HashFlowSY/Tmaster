import { fireEvent, render } from '@testing-library/react-native';
import { Pager } from './Pager';

// 行为契约测试（spec Testing Decisions）——Pager 以目标页码触发 onPageChange；首/末页时上/下一页禁用。
// 只断言可观察行为与无障碍选中/禁用态，不碰 gold-soft 底 / 金边样式（视觉双端人工核对）。
// RTL v14（React 19）下 render / fireEvent 均为异步，须 await。

describe('Pager', () => {
  it('按下某个页码以该页码触发 onPageChange', async () => {
    const onPageChange = jest.fn();
    const { getByRole } = await render(<Pager page={1} totalPages={3} onPageChange={onPageChange} />);

    await fireEvent.press(getByRole('button', { name: '2' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('按下下一页以 page+1 触发', async () => {
    const onPageChange = jest.fn();
    const { getByRole } = await render(<Pager page={1} totalPages={3} onPageChange={onPageChange} />);

    await fireEvent.press(getByRole('button', { name: '下一页' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('按下上一页以 page-1 触发', async () => {
    const onPageChange = jest.fn();
    const { getByRole } = await render(<Pager page={2} totalPages={3} onPageChange={onPageChange} />);

    await fireEvent.press(getByRole('button', { name: '上一页' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('首页时上一页禁用且不可触发', async () => {
    const onPageChange = jest.fn();
    const { getByRole } = await render(<Pager page={1} totalPages={3} onPageChange={onPageChange} />);

    const prev = getByRole('button', { name: '上一页' });
    expect(prev.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(prev);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('末页时下一页禁用且不可触发', async () => {
    const onPageChange = jest.fn();
    const { getByRole } = await render(<Pager page={3} totalPages={3} onPageChange={onPageChange} />);

    const next = getByRole('button', { name: '下一页' });
    expect(next.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('通过无障碍状态暴露当前页', async () => {
    const { getByRole } = await render(<Pager page={2} totalPages={3} onPageChange={() => {}} />);

    expect(getByRole('button', { name: '2' }).props.accessibilityState?.selected).toBe(true);
    expect(getByRole('button', { name: '1' }).props.accessibilityState?.selected).toBe(false);
  });
});
