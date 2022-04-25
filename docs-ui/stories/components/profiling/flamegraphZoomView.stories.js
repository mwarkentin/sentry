import {useState} from 'react';

import {Flamegraph} from 'sentry/components/profiling/flamegraph';
import {FullScreenFlamegraphContainer} from 'sentry/components/profiling/fullScreenFlamegraphContainer';
import {FlamegraphStateProvider} from 'sentry/utils/profiling/flamegraph/flamegraphStateProvider';
import {FlamegraphThemeProvider} from 'sentry/utils/profiling/flamegraph/flamegraphThemeProvider';
import {importProfile} from 'sentry/utils/profiling/profile/importProfile';

export default {
  title: 'Components/Profiling/FlamegraphZoomView',
};

const eventedProfiles = importProfile(
  require('sentry/utils/profiling/profile/formats/android/trace.json')
);

export const EventedTrace = () => {
  const [profiles, setProfiles] = useState(eventedProfiles);

  return (
    <FlamegraphStateProvider>
      <FlamegraphThemeProvider>
        <FullScreenFlamegraphContainer>
          <Flamegraph onImport={p => setProfiles(p)} profiles={profiles} />
        </FullScreenFlamegraphContainer>
      </FlamegraphThemeProvider>
    </FlamegraphStateProvider>
  );
};

const sampledTrace = importProfile(
  require('sentry/utils/profiling/profile/formats/ios/trace.json')
);

export const SampledTrace = () => {
  const [profiles, setProfiles] = useState(sampledTrace);

  return (
    <FlamegraphStateProvider>
      <FlamegraphThemeProvider>
        <FullScreenFlamegraphContainer>
          <Flamegraph onImport={p => setProfiles(p)} profiles={profiles} />
        </FullScreenFlamegraphContainer>
      </FlamegraphThemeProvider>
    </FlamegraphStateProvider>
  );
};

const jsSelfProfile = importProfile(
  require('sentry/utils/profiling/profile/formats/jsSelfProfile/trace.json')
);

export const JSSelfProfiling = () => {
  const [profiles, setProfiles] = useState(jsSelfProfile);

  return (
    <FlamegraphStateProvider>
      <FlamegraphThemeProvider>
        <FullScreenFlamegraphContainer>
          <Flamegraph onImport={p => setProfiles(p)} profiles={profiles} />
        </FullScreenFlamegraphContainer>
      </FlamegraphThemeProvider>
    </FlamegraphStateProvider>
  );
};

const typescriptProfile = importProfile(
  require('sentry/utils/profiling/profile/formats/typescript/trace.json')
);

export const TypescriptProfile = () => {
  const [profiles, setProfiles] = useState(typescriptProfile);

  return (
    <FlamegraphStateProvider>
      <FlamegraphThemeProvider>
        <FullScreenFlamegraphContainer>
          <Flamegraph onImport={p => setProfiles(p)} profiles={profiles} />
        </FullScreenFlamegraphContainer>
      </FlamegraphThemeProvider>
    </FlamegraphStateProvider>
  );
};
