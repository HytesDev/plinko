<script lang="ts">
  import { binColorsByRowCount, binPayouts } from '$lib/constants/game';
  import { plinkoEngine, plinkoWinRecords, riskLevel, rowCount } from '$lib/stores/game';
  import { isAnimationOn } from '$lib/stores/settings';
  import type { Action } from 'svelte/action';

  /**
   * Bounce animations for each bin, which is played when a ball falls into the bin.
   */
  let binAnimations: Animation[] = [];

  $: {
    if ($plinkoWinRecords.length) {
      const lastWinBinIndex = $plinkoWinRecords[$plinkoWinRecords.length - 1].binIndex;
      playAnimation(lastWinBinIndex);
    }
  }

  const initAnimation: Action<HTMLDivElement> = (node) => {
    const bounceAnimation = node.animate(
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(30%)' },
        { transform: 'translateY(0)' },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.18, 0.89, 0.32, 1.28)',
      },
    );
    bounceAnimation.pause(); // Don't run the animation immediately
    binAnimations.push(bounceAnimation);
  };

  function playAnimation(binIndex: number) {
    if (!$isAnimationOn) {
      return;
    }

    const animation = binAnimations[binIndex];

    // Always reset animation before playing. Safari has a weird behavior where
    // the animation will not play the second time if it's not cancelled.
    animation.cancel();

    animation.play();
  }
</script>

<!-- Height clamping in mobile: From 10px at 370px viewport width to 16px at 600px viewport width -->
<div class="flex h-[clamp(10px,0.352px+2.609vw,16px)] w-full justify-center px-2 lg:h-7">
  {#if $plinkoEngine}
    <div
      class="grid w-full max-w-[min(100%,980px)] gap-[clamp(2px,0.4vw,8px)]"
      style:grid-template-columns={`repeat(${binPayouts[$rowCount][$riskLevel].length}, minmax(0, 1fr))`}
      style:max-width={`${($plinkoEngine.binsWidthPercentage ?? 1) * 100}%`}
    >
      {#each binPayouts[$rowCount][$riskLevel] as payout, binIndex}
        <!-- Font-size clamping:
              - Mobile (< 1024px): From 6px at 370px viewport width to 8px at 600px viewport width
              - Desktop (>= 1024px): From 10px at 1024px viewport width to 12px at 1100px viewport width
         -->
        <div
          use:initAnimation
          class="flex min-w-0 items-center justify-center rounded-sm px-1.5 text-[clamp(6px,2.784px+0.87vw,8px)] font-bold text-gray-950 shadow-[0_2px_var(--shadow-color)] lg:rounded-md lg:px-2 lg:text-[clamp(10px,-16.944px+2.632vw,12px)] lg:shadow-[0_3px_var(--shadow-color)]"
          style:background-color={binColorsByRowCount[$rowCount].background[binIndex]}
          style:--shadow-color={binColorsByRowCount[$rowCount].shadow[binIndex]}
        >
          {payout}{payout < 100 ? '×' : ''}
        </div>
      {/each}
    </div>
  {/if}
</div>
