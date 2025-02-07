import { registerRoot } from 'remotion';
import { Composition } from 'remotion';
import { MyVideo } from './MyVideo';

const RemotionRoot = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={300}
    fps={30}
    width={1920}
    height={1080}
  />
);

registerRoot(RemotionRoot);
