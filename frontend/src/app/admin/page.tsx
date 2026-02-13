"use client";

import { useEffect, useState } from "react";
import {
  Coser,
  Parody,
  CosplayItem,
  fetchCosers,
  fetchParodies,
  fetchCosplays,
  formatSize,
  adminCreateCoser,
  adminUpdateCoser,
  adminDeleteCoser,
  adminCreateParody,
  adminUpdateParody,
  adminDeleteParody,
  adminCreateCosplay,
  adminUpdateCosplay,
  adminDeleteCosplay,
  adminRescanCosplay,
  adminGenerateThumbnails,
} from "../../lib/api";

type Tab = "cosers" | "parodies" | "cosplays";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("cosers");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">后台管理</h1>

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success"
                ? "bg-green-900/50 text-green-200"
                : "bg-red-900/50 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          <TabButton active={tab === "cosers"} onClick={() => setTab("cosers")}>
            Coser 管理
          </TabButton>
          <TabButton active={tab === "parodies"} onClick={() => setTab("parodies")}>
            Parody 管理
          </TabButton>
          <TabButton active={tab === "cosplays"} onClick={() => setTab("cosplays")}>
            Cosplay 管理
          </TabButton>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          {tab === "cosers" && <CoserTab showMessage={showMessage} />}
          {tab === "parodies" && <ParodyTab showMessage={showMessage} />}
          {tab === "cosplays" && <CosplayTab showMessage={showMessage} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-t transition-colors ${
        active
          ? "bg-gray-800 text-cyan-400 border-b-2 border-cyan-400"
          : "text-gray-400 hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function CoserTab({
  showMessage,
}: {
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const [cosers, setCosers] = useState<Coser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [avatarPath, setAvatarPath] = useState("");

  const loadCosers = async () => {
    setLoading(true);
    try {
      const data = await fetchCosers(1, 100);
      setCosers(data.items);
    } catch (e) {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCosers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminUpdateCoser(editingId, {
          name,
          avatar_path: avatarPath || null,
        });
        showMessage("success", "更新成功");
      } else {
        await adminCreateCoser({ name, avatar_path: avatarPath || null });
        showMessage("success", "创建成功");
      }
      setName("");
      setAvatarPath("");
      setShowForm(false);
      setEditingId(null);
      loadCosers();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleEdit = (coser: Coser) => {
    setName(coser.name);
    setAvatarPath(coser.avatar_path || "");
    setEditingId(coser.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    try {
      await adminDeleteCoser(id);
      showMessage("success", "删除成功");
      loadCosers();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Coser 列表</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setName("");
            setAvatarPath("");
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
        >
          {showForm ? "取消" : "新建 Coser"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-800 rounded space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">头像路径（可选）</label>
            <input
              type="text"
              value={avatarPath}
              onChange={(e) => setAvatarPath(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              placeholder="/path/to/avatar.avif"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
          >
            {editingId ? "更新" : "创建"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2">
          {cosers.map((coser) => (
            <div
              key={coser.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded"
            >
              <div>
                <div className="font-medium">{coser.name}</div>
                <div className="text-sm text-gray-400">
                  {coser.cosplay_count} 个图集
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(coser)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(coser.id)}
                  className="px-3 py-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {cosers.length === 0 && <div className="text-gray-400">暂无数据</div>}
        </div>
      )}
    </div>
  );
}

function ParodyTab({
  showMessage,
}: {
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const [parodies, setParodies] = useState<Parody[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");

  const loadParodies = async () => {
    setLoading(true);
    try {
      const data = await fetchParodies(1, 100);
      setParodies(data.items);
    } catch (e) {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadParodies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminUpdateParody(editingId, { name });
        showMessage("success", "更新成功");
      } else {
        await adminCreateParody({ name });
        showMessage("success", "创建成功");
      }
      setName("");
      setShowForm(false);
      setEditingId(null);
      loadParodies();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "操作失败");
    }
  };

  const handleEdit = (parody: Parody) => {
    setName(parody.name);
    setEditingId(parody.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？（关联的 Cosplay 会解除关联）")) return;
    try {
      await adminDeleteParody(id);
      showMessage("success", "删除成功");
      loadParodies();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "删除失败");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Parody 列表</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setName("");
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
        >
          {showForm ? "取消" : "新建 Parody"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-800 rounded space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
          >
            {editingId ? "更新" : "创建"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2">
          {parodies.map((parody) => (
            <div
              key={parody.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded"
            >
              <div>
                <div className="font-medium">{parody.name}</div>
                <div className="text-sm text-gray-400">
                  {parody.cosplay_count} 个图集
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(parody)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(parody.id)}
                  className="px-3 py-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {parodies.length === 0 && <div className="text-gray-400">暂无数据</div>}
        </div>
      )}
    </div>
  );
}

function CosplayTab({
  showMessage,
}: {
  showMessage: (type: "success" | "error", text: string) => void;
}) {
  const [cosplays, setCosplays] = useState<CosplayItem[]>([]);
  const [cosers, setCosers] = useState<Coser[]>([]);
  const [parodies, setParodies] = useState<Parody[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [coserId, setCoserId] = useState("");
  const [parodyId, setParodyId] = useState("");
  const [dirPath, setDirPath] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cosplaysData, cosersData, parodiesData] = await Promise.all([
        fetchCosplays(1, 100),
        fetchCosers(1, 100),
        fetchParodies(1, 100),
      ]);
      setCosplays(cosplaysData.items);
      setCosers(cosersData.items);
      setParodies(parodiesData.items);
    } catch (e) {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title,
        coser_id: Number(coserId),
        parody_id: parodyId ? Number(parodyId) : null,
        dir_path: dirPath,
      };
      if (editingId) {
        await adminUpdateCosplay(editingId, {
          title,
          coser_id: Number(coserId),
          parody_id: parodyId ? Number(parodyId) : null,
        });
        showMessage("success", "更新成功");
      } else {
        await adminCreateCosplay(data);
        showMessage("success", "创建成功");
      }
      resetForm();
      loadData();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "操作失败");
    }
  };

  const resetForm = () => {
    setTitle("");
    setCoserId("");
    setParodyId("");
    setDirPath("");
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (cosplay: CosplayItem) => {
    setTitle(cosplay.title);
    setCoserId(String(cosplay.coser_id));
    setParodyId(cosplay.parody_id ? String(cosplay.parody_id) : "");
    setDirPath(cosplay.dir_path);
    setEditingId(cosplay.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？（同时会删除该图集的所有图片哈希记录）")) return;
    try {
      await adminDeleteCosplay(id);
      showMessage("success", "删除成功");
      loadData();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "删除失败");
    }
  };

  const handleRescan = async (id: number) => {
    try {
      const result = await adminRescanCosplay(id);
      showMessage("success", `重新扫描完成：${result.photo_count} 张照片，${result.video_count} 个视频`);
      loadData();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "扫描失败");
    }
  };

  const handleGenerateThumbs = async (id: number) => {
    try {
      const result = await adminGenerateThumbnails(id);
      showMessage(
        "success",
        `生成完成：${result.thumbnails_generated} 个缩略图，${result.hashes_computed} 个哈希`
      );
      loadData();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "生成失败");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cosplay 列表</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
        >
          {showForm ? "取消" : "新建 Cosplay"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-gray-800 rounded space-y-4"
        >
          <div>
            <label className="block text-sm text-gray-400 mb-1">标题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coser</label>
              <select
                value={coserId}
                onChange={(e) => setCoserId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                required
              >
                <option value="">选择 Coser</option>
                {cosers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Parody（可选）</label>
              <select
                value={parodyId}
                onChange={(e) => setParodyId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              >
                <option value="">无</option>
                {parodies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">目录路径</label>
            <input
              type="text"
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              placeholder="/path/to/cosplay/folder"
              required={!editingId}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
          >
            {editingId ? "更新" : "创建"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-2">
          {cosplays.map((cosplay) => (
            <div
              key={cosplay.id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded"
            >
              <div className="flex-1">
                <div className="font-medium">{cosplay.title}</div>
                <div className="text-sm text-gray-400">
                  {cosplay.coser?.name || "未知"} • {cosplay.photo_count} 张照片 •{" "}
                  {formatSize(cosplay.total_size)}
                </div>
                <div className="text-xs text-gray-500 truncate max-w-md">
                  {cosplay.dir_path}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => handleRescan(cosplay.id)}
                  className="px-3 py-1 text-sm bg-blue-900/50 hover:bg-blue-900 text-blue-300 rounded"
                >
                  重新扫描
                </button>
                <button
                  onClick={() => handleGenerateThumbs(cosplay.id)}
                  className="px-3 py-1 text-sm bg-purple-900/50 hover:bg-purple-900 text-purple-300 rounded"
                >
                  生成缩略图
                </button>
                <button
                  onClick={() => handleEdit(cosplay)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(cosplay.id)}
                  className="px-3 py-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-300 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {cosplays.length === 0 && <div className="text-gray-400">暂无数据</div>}
        </div>
      )}
    </div>
  );
}