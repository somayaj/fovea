import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function ChannelsView({ me }) {
  const projectId = me.project?.id;
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.channels(projectId);
      setChannels(data.channels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [projectId]);

  const create = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await api.createChannel(projectId, name.trim());
      setName("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveRename = async (channelId) => {
    if (!editName.trim()) return;
    await api.patchChannel(channelId, { name: editName.trim() });
    setEditingId(null);
    await load();
  };

  if (loading) return <div className="page-loading">Loading channels…</div>;

  const active = channels.filter((c) => !c.archived);
  const archived = channels.filter((c) => c.archived);

  return (
    <div className="content-page">
      <div className="content-head">
        <form className="inline-form" onSubmit={create}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New channel name"
            aria-label="New channel name"
          />
          <button className="btn" type="submit">Create channel</button>
        </form>
      </div>

      {error ? <div className="alert error">{error}</div> : null}

      <div className="table-card">
        <div className="table-head">
          <span>Channel</span>
          <span>Tasks</span>
          <span>Actions</span>
        </div>
        {active.length === 0 ? (
          <div className="table-empty">No channels yet. Create one to organize tasks.</div>
        ) : (
          active.map((channel) => (
            <div key={channel.id} className="table-row">
              <div className="channel-name">
                {editingId === channel.id ? (
                  <input
                    className="inline-edit"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRename(channel.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <strong>{channel.name}</strong>
                )}
              </div>
              <span className="muted">{channel.tasks}</span>
              <div className="row-actions">
                {editingId === channel.id ? (
                  <>
                    <button className="btn small" type="button" onClick={() => saveRename(channel.id)}>
                      Save
                    </button>
                    <button className="btn secondary small" type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn secondary small"
                      type="button"
                      onClick={() => navigate(`/map?channel=${channel.id}`)}
                    >
                      View on map
                    </button>
                    <button
                      className="btn secondary small"
                      type="button"
                      onClick={() => {
                        setEditingId(channel.id);
                        setEditName(channel.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn secondary small"
                      type="button"
                      onClick={async () => {
                        await api.archiveChannel(channel.id);
                        await load();
                      }}
                    >
                      Archive
                    </button>
                    <button
                      className="btn secondary small danger"
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete "${channel.name}" and all its tasks permanently?`)) return;
                        await api.deleteChannel(channel.id);
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {archived.length > 0 ? (
        <>
          <h3 className="section-label">Archived</h3>
          <div className="table-card muted-card">
            {archived.map((channel) => (
              <div key={channel.id} className="table-row">
                <strong>{channel.name}</strong>
                <span className="muted">{channel.tasks}</span>
                <button
                  className="btn secondary small"
                  type="button"
                  onClick={async () => {
                    await api.restoreChannel(channel.id);
                    await load();
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
