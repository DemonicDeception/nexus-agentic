import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function GlowEffect() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.7}
        intensity={0.6}
        mipmapBlur
        radius={0.75}
      />
      {/* Subtle vignette — darkens edges, draws eye to center */}
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  );
}
