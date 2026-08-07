import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * 订阅系统「减少动态效果」开关。用 RN 核心 AccessibilityInfo,
 * 不耦合动画库,保持 token 层(./motion)为纯 TS(spec User Story 15、ADR-0005)。
 * 动画层拿到布尔值后配合 resolveDuration() 把时长归零。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
