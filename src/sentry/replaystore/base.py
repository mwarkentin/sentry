from __future__ import annotations

import abc
from dataclasses import dataclass
from datetime import datetime
from enum import IntEnum
from threading import local
from typing import Any, Dict, List, Tuple

from sentry.utils import json
from sentry.utils.services import Service
from sentry.utils.strings import decompress


class ReplayNotFound(ValueError):
    pass


class ReplayDataType(IntEnum):
    ROOT = 1
    EVENT = 2
    RECORDING = 3


@dataclass(frozen=True)
class ReplayContainer:
    id: str
    root: Dict[Any, Any]
    events: List[Dict[Any, Any]]
    recordings: List[Dict[Any, Any]]


json_dumps = json.JSONEncoder(
    separators=(",", ":"),
    sort_keys=True,
    skipkeys=False,
    ensure_ascii=True,
    check_circular=True,
    allow_nan=True,
    indent=None,
    encoding="utf-8",
    default=None,
).encode

json_loads = json._default_decoder.decode


class ReplayStore(abc.ABC, local, Service):
    KEY_DELIMETER = ":"

    def get_replay(self, key: str) -> ReplayContainer | None:
        try:
            root, events, recordings = self._get_all_events_for_replay(key)
        except ReplayNotFound:
            return None
        replay = ReplayContainer(key, root, events, recordings)
        return replay

    def set(
        self, replay_root_id: str, data: Any, replay_data_type: ReplayDataType, timestamp: datetime
    ) -> None:
        key = self._row_key(replay_root_id, replay_data_type, timestamp.timestamp())

        value = self._encode(data)

        self._set_bytes(key, value)

    def _get_all_events_for_replay(
        self, key: str
    ) -> Tuple[Dict[Any, Any], List[Dict[Any, Any]], List[Dict[Any, Any]]]:
        data = self._get_rows(key)
        if len(data) == 0:
            raise ReplayNotFound

        events = []
        recordings = []
        for row in data:
            row_data = row[1]
            replay_data_type = self._get_row_type(row[0])

            if replay_data_type == ReplayDataType.ROOT:
                root: Dict[Any, Any] = self._decode(decompress(row_data))
            if replay_data_type == ReplayDataType.EVENT:
                events.append(self._decode(decompress(row_data)))
            if replay_data_type == ReplayDataType.RECORDING:
                recordings.append(self._decode(decompress(row_data)))

        return root, events, recordings

    def _get_row_type(self, key: str) -> ReplayDataType:
        return ReplayDataType(int(key.split(self.KEY_DELIMETER)[1]))

    @abc.abstractmethod
    def _get_rows(self, key: Any) -> List[Tuple[str, bytes]]:
        pass

    def _encode(self, value: Dict[Any, Any]) -> bytes:
        encoded: bytes = json_dumps(value).encode("utf8")
        return encoded

    def _decode(self, value: bytes) -> Dict[Any, Any]:
        json_loaded: Dict[Any, Any] = json_loads(value)
        return json_loaded

    def _row_key(
        self, replay_root_id: str, replay_data_type: ReplayDataType, timestamp: float
    ) -> str:
        return (
            f"{replay_root_id}{self.KEY_DELIMETER}{replay_data_type}{self.KEY_DELIMETER}{timestamp}"
        )
