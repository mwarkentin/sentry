import {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';

import {Client} from 'sentry/api';
import Alert from 'sentry/components/alert';
import * as Layout from 'sentry/components/layouts/thirds';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import {Breadcrumb} from 'sentry/components/profiling/breadcrumb';
import {Flamegraph} from 'sentry/components/profiling/flamegraph';
import {FullScreenFlamegraphContainer} from 'sentry/components/profiling/fullScreenFlamegraphContainer';
import {ProfileDragDropImportProps} from 'sentry/components/profiling/profileDragDropImport';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {t} from 'sentry/locale';
import {Organization, Project} from 'sentry/types';
import {Trace} from 'sentry/types/profiling/core';
import {DeepPartial} from 'sentry/types/utils';
import {
  decodeFlamegraphStateFromQueryParams,
  FlamegraphState,
  FlamegraphStateProvider,
  FlamegraphStateQueryParamSync,
} from 'sentry/utils/profiling/flamegraph/flamegraphStateProvider';
import {FlamegraphThemeProvider} from 'sentry/utils/profiling/flamegraph/flamegraphThemeProvider';
import {importProfile, ProfileGroup} from 'sentry/utils/profiling/profile/importProfile';
import {Profile} from 'sentry/utils/profiling/profile/profile';
import useApi from 'sentry/utils/useApi';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';

type RequestState = 'initial' | 'loading' | 'resolved' | 'errored';

function fetchFlamegraphs(
  api: Client,
  eventId: string,
  projectId: Project['id'],
  organization: Organization
): Promise<ProfileGroup> {
  return api
    .requestPromise(
      `/projects/${organization.slug}/${projectId}/profiling/profiles/${eventId}/`,
      {
        method: 'GET',
        includeAllArgs: true,
      }
    )
    .then(([data]) => importProfile(data, eventId));
}

const LoadingGroup: ProfileGroup = {
  name: 'Loading',
  traceID: '',
  activeProfileIndex: 0,
  profiles: [Profile.Empty()],
};

interface FlamegraphViewProps {
  location: Location;
  params: {
    eventId?: Trace['id'];
    projectId?: Project['id'];
  };
}

function FlamegraphView(props: FlamegraphViewProps): React.ReactElement {
  const api = useApi();
  const organization = useOrganization();
  const location = useLocation();

  const [profiles, setProfiles] = useState<ProfileGroup | null>(null);
  const [requestState, setRequestState] = useState<RequestState>('initial');

  const initialFlamegraphPreferencesState = useMemo((): DeepPartial<FlamegraphState> => {
    if (!profiles) {
      return decodeFlamegraphStateFromQueryParams(location.query);
    }

    const decodedState = decodeFlamegraphStateFromQueryParams(location.query);

    return {
      ...decodedState,
      profiles: {
        activeProfileIndex:
          decodedState?.profiles?.activeProfileIndex ?? profiles.activeProfileIndex ?? 0,
      },
    };
  }, [profiles]);

  // Sometimes the page we are coming from had scrollTop > 0, so we need to
  // force restore it to top of page because scrolling on a flamegraph does not scroll the page
  useEffect(() => {
    document.scrollingElement?.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!props.params.eventId || !props.params.projectId) {
      return undefined;
    }

    setRequestState('loading');

    fetchFlamegraphs(api, props.params.eventId, props.params.projectId, organization)
      .then(importedFlamegraphs => {
        setProfiles(importedFlamegraphs);
        setRequestState('resolved');
      })
      .catch(() => setRequestState('errored'));

    return () => {
      api.clear();
    };
  }, [props.params.eventId, props.params.projectId, api, organization]);

  const onImport: ProfileDragDropImportProps['onImport'] = useCallback(profileGroup => {
    setProfiles(profileGroup);
  }, []);

  return (
    <SentryDocumentTitle title={t('Profiling')} orgSlug={organization.slug}>
      {/*
        We key the provider by traceID meaning that once traceID changes (e.g. when a new trace is loaded), all
        reducer history and all previous state is lost. This means that you cannot undo importing a trace.
        This is intentional, but could be improved by storing the profiles inside the reducer state. We would just need
        to make sure that we are not storing large copies of profiles in memory for each reducer action that is dispatched.
       */}
      <FlamegraphStateProvider
        key={profiles?.traceID ?? 'stable key'}
        initialState={initialFlamegraphPreferencesState}
      >
        <FlamegraphStateQueryParamSync />
        <FlamegraphThemeProvider>
          <Fragment>
            <Layout.Header>
              <Layout.HeaderContent>
                <Breadcrumb
                  location={props.location}
                  organization={organization}
                  trails={[
                    {type: 'profiling'},
                    {
                      type: 'flamegraph',
                      payload: {
                        interactionName: profiles?.name ?? '',
                        profileId: props.params.eventId ?? '',
                        projectSlug: props.params.projectId ?? '',
                      },
                    },
                  ]}
                />
              </Layout.HeaderContent>
            </Layout.Header>
            <FullScreenFlamegraphContainer>
              {requestState === 'errored' ? (
                <Alert type="error" showIcon>
                  {t('Unable to load profiles')}
                </Alert>
              ) : requestState === 'loading' ? (
                <Fragment>
                  <Flamegraph onImport={onImport} profiles={LoadingGroup} />
                  <LoadingIndicatorContainer>
                    <LoadingIndicator />
                  </LoadingIndicatorContainer>
                </Fragment>
              ) : requestState === 'resolved' && profiles ? (
                <Flamegraph onImport={onImport} profiles={profiles} />
              ) : null}
            </FullScreenFlamegraphContainer>
          </Fragment>
        </FlamegraphThemeProvider>
      </FlamegraphStateProvider>
    </SentryDocumentTitle>
  );
}

const LoadingIndicatorContainer = styled('div')`
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

export default FlamegraphView;
