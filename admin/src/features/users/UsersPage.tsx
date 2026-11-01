import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api from "../../lib/api";
import "./UsersPage.css";

type AdminRole = "OWNER" | "ADMIN";

type AdminPermission =
  | "projects"
  | "blog"
  | "experience"
  | "skills"
  | "language-skills"
  | "profile"
  | "navigation"
  | "site-management"
  | "media"
  | "feedback"
  | "polls";

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: AdminRole;
  permissions: AdminPermission[];
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserForm = {
  email: string;
  password: string;
  fullName: string;
  username: string;
  phone: string;
  permissions: AdminPermission[];
};

const PERMISSIONS: {
  value: AdminPermission;
  label: string;
  description: string;
}[] = [
  {
    value: "projects",
    label: "پروژه‌ها",
    description: "مدیریت پروژه‌های پورتفولیو",
  },
  {
    value: "blog",
    label: "وبلاگ",
    description: "مدیریت مقالات، دسته‌بندی‌ها و برچسب‌ها",
  },
  {
    value: "experience",
    label: "سوابق کاری",
    description: "مدیریت تجربیات و سوابق شغلی",
  },
  {
    value: "skills",
    label: "مهارت‌ها",
    description: "مدیریت مهارت‌های فنی",
  },
  {
    value: "language-skills",
    label: "مهارت‌های زبانی",
    description: "مدیریت زبان‌ها و سطح مهارت",
  },
  {
    value: "profile",
    label: "پروفایل",
    description: "مدیریت اطلاعات پروفایل",
  },
  {
    value: "navigation",
    label: "منوی سایت",
    description: "مدیریت لینک‌ها و منوی اصلی",
  },
  {
    value: "site-management",
    label: "مدیریت سایت",
    description: "مدیریت بخش‌ها و تنظیمات سایت",
  },
  {
    value: "media",
    label: "رسانه‌ها",
    description: "مدیریت تصاویر و فایل‌ها",
  },
  {
    value: "feedback",
    label: "بازخوردها",
    description: "مدیریت نظرات و بازخوردها",
  },
  {
    value: "polls",
    label: "نظرسنجی‌ها",
    description: "مدیریت نظرسنجی‌ها و پاسخ‌ها",
  },
];

const EMPTY_FORM: UserForm = {
  email: "",
  password: "",
  fullName: "",
  username: "",
  phone: "",
  permissions: [],
};

const getErrorMessage = (error: unknown): string => {
  const response = (
    error as {
      response?: {
        data?: {
          message?: string | string[];
        };
      };
    }
  )?.response;

  const message = response?.data?.message;

  if (Array.isArray(message)) {
    return message.join("، ");
  }

  if (typeof message === "string") {
    return message;
  }

  return "عملیات انجام نشد. لطفاً دوباره تلاش کن.";
};

const formatDate = (date: string | null): string => {
  if (!date) {
    return "هنوز وارد نشده";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "نامشخص";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [permissionsForm, setPermissionsForm] = useState<AdminPermission[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(EMPTY_FORM);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Fetch users for refresh and post-mutation updates.
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get<AdminUser[]>("/admin/users");

      setUsers(data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users on initial mount.
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const { data } = await api.get<AdminUser[]>("/admin/users");

        if (isMounted) {
          setUsers(data);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.username ?? "").toLowerCase().includes(query)
    );
  });

  const ownerCount = users.filter((user) => user.role === "OWNER").length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;
  const activeCount = users.filter((user) => user.active).length;

  const openCreateModal = () => {
    setUserForm({
      ...EMPTY_FORM,
      permissions: [],
    });

    setError("");
    setNotice("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) {
      return;
    }

    setShowCreateModal(false);
    setUserForm(EMPTY_FORM);
    setError("");
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (userForm.password.length < 12) {
      setError("رمز عبور باید حداقل ۱۲ کاراکتر داشته باشد.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/admin/users", {
        email: userForm.email.trim(),
        password: userForm.password,
        fullName: userForm.fullName.trim(),
        username: userForm.username.trim() || undefined,
        phone: userForm.phone.trim() || undefined,
        permissions: userForm.permissions,
      });

      setShowCreateModal(false);
      setUserForm(EMPTY_FORM);
      setNotice("حساب مدیر جدید با موفقیت ایجاد شد.");

      await loadUsers();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const openPermissionsModal = (user: AdminUser) => {
    setEditingUser(user);
    setPermissionsForm([...user.permissions]);
    setError("");
    setNotice("");
  };

  const closePermissionsModal = () => {
    if (saving) {
      return;
    }

    setEditingUser(null);
    setPermissionsForm([]);
    setError("");
  };

  const togglePermission = (permission: AdminPermission) => {
    setPermissionsForm((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const handleUpdatePermissions = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setError("");
    setNotice("");

    try {
      setSaving(true);

      await api.patch(`/admin/users/${editingUser.id}/permissions`, {
        permissions: permissionsForm,
      });

      setUsers((current) =>
        current.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                permissions: [...permissionsForm],
              }
            : user,
        ),
      );

      setEditingUser(null);
      setPermissionsForm([]);
      setNotice("دسترسی‌های کاربر با موفقیت به‌روزرسانی شد.");
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.role === "OWNER" || statusUpdatingId !== null) {
      return;
    }

    const action = user.active ? "غیرفعال" : "فعال";

    const confirmed = window.confirm(
      `آیا از ${action} کردن حساب ${user.fullName} مطمئنی؟`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setNotice("");
    setStatusUpdatingId(user.id);

    try {
      const nextStatus = !user.active;

      await api.patch(`/admin/users/${user.id}/status`, {
        active: nextStatus,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                active: nextStatus,
              }
            : item,
        ),
      );

      setNotice(`حساب ${user.fullName} ${action} شد.`);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleRefresh = async () => {
    setNotice("");
    await loadUsers();
  };

  return (
    <div className="users-page">
      <div className="users-heading">
        <div>
          <span className="users-eyebrow">
            <ShieldCheck size={15} />
            امنیت و مدیریت دسترسی
          </span>

          <h1>کاربران و دسترسی‌ها</h1>

          <p>حساب مدیران پنل را مدیریت کن و دسترسی هر کاربر را مشخص کن.</p>
        </div>

        <div className="users-heading-actions">
          <button
            type="button"
            className="users-refresh"
            onClick={() => void handleRefresh()}
            disabled={loading}>
            <RefreshCw size={17} />
            بروزرسانی
          </button>

          <button
            type="button"
            className="users-primary"
            onClick={openCreateModal}>
            <Plus size={17} />
            افزودن مدیر
          </button>
        </div>
      </div>

      {notice && (
        <div className="users-alert success">
          <Check size={17} />

          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !showCreateModal && !editingUser && (
        <div className="users-alert error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="users-stats">
        <article className="users-stat-card">
          <span className="users-stat-icon purple">
            <Users size={20} />
          </span>

          <div>
            <span>کل کاربران</span>
            <strong>{users.length}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon blue">
            <ShieldCheck size={20} />
          </span>

          <div>
            <span>مدیران</span>
            <strong>{adminCount}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon green">
            <Eye size={20} />
          </span>

          <div>
            <span>حساب‌های فعال</span>
            <strong>{activeCount}</strong>
          </div>
        </article>

        <article className="users-stat-card">
          <span className="users-stat-icon orange">
            <Shield size={20} />
          </span>

          <div>
            <span>مالک پنل</span>
            <strong>{ownerCount}</strong>
          </div>
        </article>
      </div>

      <div className="users-toolbar">
        <div>
          <h2>فهرست کاربران</h2>
          <p>مدیریت حساب‌ها و سطح دسترسی مدیران</p>
        </div>

        <label className="users-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو بر اساس نام، ایمیل یا نام کاربری..."
          />
        </label>
      </div>

      {loading ? (
        <div className="users-state">
          <LoaderCircle className="users-spinner" size={25} />
          <span>در حال دریافت کاربران...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-state">
          <Users size={30} />

          <strong>
            {search
              ? "کاربری با این مشخصات پیدا نشد."
              : "هنوز کاربری ثبت نشده است."}
          </strong>

          {!search && (
            <button
              type="button"
              className="users-primary"
              onClick={openCreateModal}>
              <Plus size={16} />
              ایجاد اولین مدیر
            </button>
          )}
        </div>
      ) : (
        <div className="users-table-wrapper">
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th className="user-column">کاربر</th>
                  <th>نقش</th>
                  <th>وضعیت</th>
                  <th>دسترسی‌ها</th>
                  <th>آخرین ورود</th>
                  <th>تاریخ عضویت</th>
                  <th className="actions-column">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="users-table-user">
                        <div className="users-table-avatar">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName} />
                          ) : (
                            <UserRound size={19} />
                          )}
                        </div>

                        <div className="users-table-identity">
                          <strong>{user.fullName}</strong>
                          <span dir="ltr">{user.email}</span>
                          {user.username && (
                            <small dir="ltr">@{user.username}</small>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`users-table-role ${user.role.toLowerCase()}`}>
                        {user.role === "OWNER" ? "مالک پنل" : "مدیر"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-table-status ${
                          user.active ? "active" : "inactive"
                        }`}>
                        <span className="status-dot" />
                        {user.active ? "فعال" : "غیرفعال"}
                      </span>
                    </td>

                    <td>
                      <div className="users-table-permissions">
                        {user.role === "OWNER" ? (
                          <span className="permission-chip owner-chip">
                            دسترسی کامل
                          </span>
                        ) : user.permissions.length > 0 ? (
                          <>
                            {user.permissions.slice(0, 2).map((permission) => (
                              <span
                                className="permission-chip"
                                key={permission}>
                                {PERMISSIONS.find(
                                  (item) => item.value === permission,
                                )?.label ?? permission}
                              </span>
                            ))}

                            {user.permissions.length > 2 && (
                              <span className="permission-chip more">
                                +{user.permissions.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="permission-chip empty">
                            بدون دسترسی
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="users-table-date">
                        {formatDate(user.lastLoginAt)}
                      </span>
                    </td>

                    <td>
                      <span className="users-table-date">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    <td>
                      {user.role === "ADMIN" ? (
                        <div className="users-table-actions">
                          <button
                            type="button"
                            className="table-action permissions"
                            title="مدیریت دسترسی‌ها"
                            onClick={() => openPermissionsModal(user)}
                            disabled={statusUpdatingId === user.id}>
                            <Shield size={16} />
                          </button>

                          <button
                            type="button"
                            className={`table-action ${
                              user.active ? "deactivate" : "activate"
                            }`}
                            title={user.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                            onClick={() => void handleToggleStatus(user)}
                            disabled={statusUpdatingId !== null}>
                            {statusUpdatingId === user.id ? (
                              <LoaderCircle
                                className="users-spinner"
                                size={16}
                              />
                            ) : user.active ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="users-owner-label">
                          <ShieldCheck size={15} />
                          محافظت‌شده
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="users-table-footer">
            <span>
              نمایش <strong>{filteredUsers.length}</strong> کاربر از{" "}
              <strong>{users.length}</strong> کاربر
            </span>

            <span>برای مشاهده تمام ستون‌ها، جدول را افقی جابه‌جا کن.</span>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="users-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}>
          <section
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title">
            <header className="users-modal-header">
              <div>
                <span className="users-eyebrow">
                  <UserRound size={14} />
                  حساب کاربری جدید
                </span>

                <h2 id="create-user-title">افزودن مدیر</h2>

                <p>اطلاعات حساب و دسترسی‌های اولیه را مشخص کن.</p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleCreateUser}>
              <div className="users-modal-body">
                {error && (
                  <div className="users-alert error">
                    <span>{error}</span>

                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن پیام">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="users-form-grid">
                  <label className="users-field">
                    <span>نام و نام خانوادگی *</span>

                    <input
                      value={userForm.fullName}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          fullName: event.target.value,
                        }))
                      }
                      minLength={2}
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className="users-field">
                    <span>ایمیل *</span>

                    <input
                      type="email"
                      dir="ltr"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      maxLength={254}
                      required
                    />
                  </label>

                  <label className="users-field">
                    <span>رمز عبور *</span>

                    <input
                      type="password"
                      dir="ltr"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />

                    <small>حداقل ۱۲ کاراکتر</small>
                  </label>

                  <label className="users-field">
                    <span>نام کاربری</span>

                    <input
                      dir="ltr"
                      value={userForm.username}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      minLength={2}
                      maxLength={50}
                    />
                  </label>

                  <label className="users-field">
                    <span>شماره تماس</span>

                    <input
                      dir="ltr"
                      value={userForm.phone}
                      onChange={(event) =>
                        setUserForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      maxLength={30}
                    />
                  </label>
                </div>

                <div className="users-permission-section">
                  <div className="users-permission-heading">
                    <div>
                      <h3>دسترسی‌های مدیر</h3>

                      <p>
                        مشخص کن این کاربر به کدام بخش‌های پنل دسترسی داشته باشد.
                      </p>
                    </div>

                    <span>
                      {userForm.permissions.length} از {PERMISSIONS.length}
                    </span>
                  </div>

                  <div className="users-permission-grid">
                    {PERMISSIONS.map((permission) => {
                      const checked = userForm.permissions.includes(
                        permission.value,
                      );

                      return (
                        <label
                          className={`users-permission-option ${
                            checked ? "selected" : ""
                          }`}
                          key={permission.value}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setUserForm((current) => ({
                                ...current,
                                permissions: checked
                                  ? current.permissions.filter(
                                      (item) => item !== permission.value,
                                    )
                                  : [...current.permissions, permission.value],
                              }))
                            }
                          />

                          <span className="permission-check">
                            {checked && <Check size={13} />}
                          </span>

                          <span className="permission-option-text">
                            <strong>{permission.label}</strong>
                            <small>{permission.description}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <footer className="users-modal-footer">
                <button
                  type="button"
                  className="users-secondary"
                  onClick={closeCreateModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="users-primary"
                  disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="users-spinner" size={16} />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "در حال ایجاد..." : "ایجاد حساب مدیر"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {editingUser && (
        <div
          className="users-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePermissionsModal();
            }
          }}>
          <section
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-permissions-title">
            <header className="users-modal-header">
              <div>
                <span className="users-eyebrow">
                  <ShieldCheck size={14} />
                  تنظیم سطح دسترسی
                </span>

                <h2 id="edit-permissions-title">دسترسی‌های مدیر</h2>

                <p>
                  {editingUser.fullName} — {editingUser.email}
                </p>
              </div>

              <button
                type="button"
                onClick={closePermissionsModal}
                aria-label="بستن">
                <X size={19} />
              </button>
            </header>

            <form onSubmit={handleUpdatePermissions}>
              <div className="users-modal-body">
                {error && (
                  <div className="users-alert error">
                    <span>{error}</span>

                    <button
                      type="button"
                      onClick={() => setError("")}
                      aria-label="بستن پیام">
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div className="users-permission-heading">
                  <div>
                    <h3>مجوزهای قابل انتخاب</h3>

                    <p>با انتخاب هر گزینه، دسترسی مربوط به آن فعال می‌شود.</p>
                  </div>

                  <span>
                    {permissionsForm.length} از {PERMISSIONS.length}
                  </span>
                </div>

                <div className="users-permission-grid">
                  {PERMISSIONS.map((permission) => {
                    const checked = permissionsForm.includes(permission.value);

                    return (
                      <label
                        className={`users-permission-option ${
                          checked ? "selected" : ""
                        }`}
                        key={permission.value}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(permission.value)}
                        />

                        <span className="permission-check">
                          {checked && <Check size={13} />}
                        </span>

                        <span className="permission-option-text">
                          <strong>{permission.label}</strong>
                          <small>{permission.description}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <footer className="users-modal-footer">
                <button
                  type="button"
                  className="users-secondary"
                  onClick={closePermissionsModal}
                  disabled={saving}>
                  انصراف
                </button>

                <button
                  type="submit"
                  className="users-primary"
                  disabled={saving}>
                  {saving ? (
                    <LoaderCircle className="users-spinner" size={16} />
                  ) : (
                    <Save size={16} />
                  )}

                  {saving ? "در حال ذخیره..." : "ذخیره دسترسی‌ها"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
