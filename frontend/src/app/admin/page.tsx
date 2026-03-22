"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type CosplayCreate,
  type Coser,
  type Parody,
  type CosplayItem,
  type ScrapedCosplayCandidate,
  fetchCosers,
  fetchParodies,
  fetchCosplays,
  formatSize,
  adminBatchCreateCosplays,
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
  adminScrapeCosplayPreview,
} from "@/lib/api";

type Tab = "cosers" | "parodies" | "cosplays";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("cosers");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="w-full">
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

  const loadCosers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCosers(1, 100);
      setCosers(data.items);
    } catch {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCosers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCosers]);

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

  const loadParodies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchParodies(1, 100);
      setParodies(data.items);
    } catch {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadParodies();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadParodies]);

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
  const parseCosplayDirName = useCallback((input: string) => {
    const folderName = input.trim().split(/[\\/]/).filter(Boolean).pop() ?? "";
    const normalizedName = folderName
      .replace(/\s+\d+p(?:\s+\d+v)?$/i, "")
      .trim();
    const parts = normalizedName
      .split(" - ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 3) {
      return null;
    }

    return {
      coserName: parts[0],
      parodyName: parts[1],
      title: parts.slice(2).join(" - "),
    };
  }, []);

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
  const [titleTouched, setTitleTouched] = useState(false);
  const [coserTouched, setCoserTouched] = useState(false);
  const [parodyTouched, setParodyTouched] = useState(false);
  const [autoDetected, setAutoDetected] = useState<{
    coserName: string;
    parodyName: string;
    title: string;
  } | null>(null);
  const [scrapeRootDir, setScrapeRootDir] = useState("");
  const [scrapedItems, setScrapedItems] = useState<ScrapedCosplayCandidate[]>([]);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [submittingScraped, setSubmittingScraped] = useState(false);
  const [selectedScrapedItems, setSelectedScrapedItems] = useState<number[]>([]);

  const loadData = useCallback(async () => {
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
    } catch {
      showMessage("error", "加载失败");
    }
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: title || undefined,
        coser_id: coserId ? Number(coserId) : undefined,
        parody_id: parodyId ? Number(parodyId) : null,
        dir_path: dirPath,
      };
      if (editingId) {
        await adminUpdateCosplay(editingId, {
          title,
          coser_id: Number(coserId),
          parody_id: parodyId ? Number(parodyId) : null,
          dir_path: dirPath,
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
    setTitleTouched(false);
    setCoserTouched(false);
    setParodyTouched(false);
    setAutoDetected(null);
    setShowForm(false);
    setEditingId(null);
  };

  const applyAutoDetectedValues = useCallback(
    (nextDirPath: string) => {
      if (editingId) {
        return;
      }

      const parsed = parseCosplayDirName(nextDirPath);
      setAutoDetected(parsed);
      if (!parsed) {
        return;
      }

      if (!titleTouched) {
        setTitle(parsed.title);
      }

      if (!coserTouched) {
        const matchedCoser = cosers.find((coser) => coser.name === parsed.coserName);
        setCoserId(matchedCoser ? String(matchedCoser.id) : "");
      }

      if (!parodyTouched) {
        const matchedParody = parodies.find(
          (parody) => parody.name === parsed.parodyName
        );
        setParodyId(matchedParody ? String(matchedParody.id) : "");
      }
    },
    [coserTouched, cosers, editingId, parodyTouched, parodies, parseCosplayDirName, titleTouched]
  );

  const resetToAutoDetected = useCallback(() => {
    if (!dirPath.trim()) {
      return;
    }

    const parsed = parseCosplayDirName(dirPath);
    setTitleTouched(false);
    setCoserTouched(false);
    setParodyTouched(false);
    setAutoDetected(parsed);

    if (!parsed) {
      return;
    }

    setTitle(parsed.title);

    const matchedCoser = cosers.find((coser) => coser.name === parsed.coserName);
    setCoserId(matchedCoser ? String(matchedCoser.id) : "");

    const matchedParody = parodies.find(
      (parody) => parody.name === parsed.parodyName
    );
    setParodyId(matchedParody ? String(matchedParody.id) : "");
  }, [cosers, dirPath, parodies, parseCosplayDirName]);

  const handleEdit = (cosplay: CosplayItem) => {
    setTitle(cosplay.title);
    setCoserId(String(cosplay.coser_id));
    setParodyId(cosplay.parody_id ? String(cosplay.parody_id) : "");
    setDirPath(cosplay.dir_path);
    setTitleTouched(true);
    setCoserTouched(true);
    setParodyTouched(true);
    setAutoDetected(null);
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

  const handleScrapePreview = async () => {
    if (!scrapeRootDir.trim()) {
      showMessage("error", "请先填写待刮削的根目录");
      return;
    }

    setScrapeLoading(true);
    try {
      const result = await adminScrapeCosplayPreview(scrapeRootDir.trim());
      setScrapedItems(result.items);
      setSelectedScrapedItems(result.items.map((_, index) => index));
      showMessage("success", `已识别 ${result.items.length} 个候选图集`);
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "刮削失败");
    }
    setScrapeLoading(false);
  };

  const handleScrapedFieldChange = <K extends keyof ScrapedCosplayCandidate>(
    index: number,
    key: K,
    value: ScrapedCosplayCandidate[K]
  ) => {
    setScrapedItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  };

  const toggleScrapedSelection = (index: number) => {
    setSelectedScrapedItems((items) =>
      items.includes(index)
        ? items.filter((item) => item !== index)
        : [...items, index]
    );
  };

  const handleBatchCreate = async () => {
    const items = scrapedItems.filter((_, index) => selectedScrapedItems.includes(index));
    if (items.length === 0) {
      showMessage("error", "请至少选择一个候选图集");
      return;
    }

    setSubmittingScraped(true);
    try {
      const payload: CosplayCreate[] = items.map((item) => ({
        dir_path: item.dir_path,
        title: item.title,
        coser_id: item.coser_id ?? undefined,
        parody_id: item.parody_id ?? undefined,
      }));
      const result = await adminBatchCreateCosplays(payload);
      showMessage("success", `成功创建 ${result.created.length} 个图集`);
      setScrapedItems([]);
      setSelectedScrapedItems([]);
      setScrapeRootDir("");
      void loadData();
    } catch (e: unknown) {
      showMessage("error", e instanceof Error ? e.message : "批量创建失败");
    }
    setSubmittingScraped(false);
  };

  const selectAllScrapedItems = () => {
    setSelectedScrapedItems(scrapedItems.map((_, index) => index));
  };

  const clearScrapedSelection = () => {
    setSelectedScrapedItems([]);
  };

  const selectOnlyNewScrapedItems = () => {
    setSelectedScrapedItems(
      scrapedItems
        .map((item, index) => {
          const exists = cosplays.some(
            (cosplay) => cosplay.dir_path === item.dir_path
          );
          return exists ? null : index;
        })
        .filter((index): index is number => index !== null)
    );
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
            <label className="block text-sm text-gray-400 mb-1">
              标题（留空则按目录名自动生成）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitleTouched(true);
                setTitle(e.target.value);
              }}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              placeholder="例如：阿米娅 时序花圃肉便器"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Coser（留空则按目录名自动识别）
              </label>
              <select
                value={coserId}
                onChange={(e) => {
                  setCoserTouched(true);
                  setCoserId(e.target.value);
                }}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
              >
                <option value="">自动识别</option>
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
                onChange={(e) => {
                  setParodyTouched(true);
                  setParodyId(e.target.value);
                }}
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
                onChange={(e) => {
                  const nextDirPath = e.target.value;
                  setDirPath(nextDirPath);
                  applyAutoDetectedValues(nextDirPath);
                }}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded focus:border-cyan-500 focus:outline-none"
                placeholder="例如：/path/to/北乃芽子Hokunaimeko - 明日方舟 - 暴行 12p"
                required={!editingId}
              />
              <p className="mt-2 text-xs text-gray-500">
                目录名格式：Coser - 作品 - 角色 [变体] XXp [XXv]
              </p>
              {autoDetected && (
                <div className="mt-3 rounded border border-cyan-900/60 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-100">
                  <div>自动识别 Coser：{autoDetected.coserName}</div>
                  <div>自动识别作品：{autoDetected.parodyName}</div>
                  <div>自动识别标题：{autoDetected.title}</div>
                  <button
                    type="button"
                    onClick={resetToAutoDetected}
                    className="mt-3 rounded bg-cyan-700/70 px-2 py-1 text-xs text-white transition-colors hover:bg-cyan-600"
                  >
                    重置为自动识别
                  </button>
                </div>
              )}
            </div>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
          >
            {editingId ? "更新" : "创建"}
          </button>
        </form>
      )}

      <div className="mb-6 rounded border border-gray-800 bg-gray-900/60 p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">自动刮削</h3>
          <p className="mt-1 text-sm text-gray-400">
            输入一个根目录，系统会扫描其中符合命名规范的子目录，生成可编辑列表，再一次性提交。
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={scrapeRootDir}
            onChange={(e) => setScrapeRootDir(e.target.value)}
            className="flex-1 rounded border border-gray-700 bg-gray-950 px-3 py-2 focus:border-cyan-500 focus:outline-none"
            placeholder="例如：/path/to/import-root"
          />
          <button
            type="button"
            onClick={handleScrapePreview}
            disabled={scrapeLoading}
            className="rounded bg-cyan-600 px-4 py-2 transition-colors hover:bg-cyan-700 disabled:opacity-50"
          >
            {scrapeLoading ? "刮削中..." : "开始刮削"}
          </button>
        </div>

        {scrapedItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                共 {scrapedItems.length} 个候选，已选择 {selectedScrapedItems.length} 个
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllScrapedItems}
                  className="rounded bg-gray-800 px-3 py-2 text-sm transition-colors hover:bg-gray-700"
                >
                  全选
                </button>
                <button
                  type="button"
                  onClick={clearScrapedSelection}
                  className="rounded bg-gray-800 px-3 py-2 text-sm transition-colors hover:bg-gray-700"
                >
                  全不选
                </button>
                <button
                  type="button"
                  onClick={selectOnlyNewScrapedItems}
                  className="rounded bg-gray-800 px-3 py-2 text-sm transition-colors hover:bg-gray-700"
                >
                  仅选未导入项
                </button>
                <button
                  type="button"
                  onClick={handleBatchCreate}
                  disabled={submittingScraped}
                  className="rounded bg-green-600 px-4 py-2 text-sm transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {submittingScraped ? "提交中..." : "一次性提交已选项"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {scrapedItems.map((item, index) => {
                const matchedCoser = cosers.find((coser) => coser.name === item.coser_name);
                const matchedParody = parodies.find(
                  (parody) => parody.name === item.parody_name
                );

                return (
                  <div
                    key={`${item.dir_path}-${index}`}
                    className="rounded border border-gray-800 bg-gray-950/60 p-4"
                  >
                    {cosplays.some((cosplay) => cosplay.dir_path === item.dir_path) && (
                      <div className="mb-3 text-xs text-amber-300">
                        已存在相同目录的图集记录
                      </div>
                    )}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={selectedScrapedItems.includes(index)}
                          onChange={() => toggleScrapedSelection(index)}
                        />
                        选择提交
                      </label>
                      <div className="text-xs text-gray-500">{item.folder_name}</div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">标题</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleScrapedFieldChange(index, "title", e.target.value)
                          }
                          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Coser</label>
                        <input
                          type="text"
                          value={item.coser_name}
                          onChange={(e) => {
                            handleScrapedFieldChange(index, "coser_name", e.target.value);
                            const matched = cosers.find(
                              (coser) => coser.name === e.target.value
                            );
                            handleScrapedFieldChange(
                              index,
                              "coser_id",
                              matched ? matched.id : null
                            );
                          }}
                          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 focus:border-cyan-500 focus:outline-none"
                        />
                        {!matchedCoser && (
                          <div className="mt-1 text-xs text-amber-300">
                            将自动创建 Coser：{item.coser_name}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Parody</label>
                        <input
                          type="text"
                          value={item.parody_name ?? ""}
                          onChange={(e) => {
                            const nextName = e.target.value.trim();
                            handleScrapedFieldChange(
                              index,
                              "parody_name",
                              nextName || null
                            );
                            const matched = parodies.find(
                              (parody) => parody.name === nextName
                            );
                            handleScrapedFieldChange(
                              index,
                              "parody_id",
                              matched ? matched.id : null
                            );
                          }}
                          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 focus:border-cyan-500 focus:outline-none"
                        />
                        {item.parody_name && !matchedParody && (
                          <div className="mt-1 text-xs text-amber-300">
                            将自动创建 Parody：{item.parody_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      {item.photo_count} 张照片
                      {item.video_count > 0 ? ` / ${item.video_count} 个视频` : ""}
                      {` / ${formatSize(item.total_size)}`}
                    </div>
                    <div className="mt-1 truncate text-xs text-gray-600">{item.dir_path}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
