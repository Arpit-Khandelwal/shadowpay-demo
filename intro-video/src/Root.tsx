import React from 'react';
import { Composition } from 'remotion';
import { ShadowPayIntro } from './ShadowPayIntro';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ShadowPayIntro"
      component={ShadowPayIntro}
      durationInFrames={390}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
