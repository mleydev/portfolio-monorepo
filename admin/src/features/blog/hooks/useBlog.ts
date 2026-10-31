import { useCallback, useEffect, useState } from "react";

import type {
  BlogArticle,
  CreateBlogArticlePayload,
  UpdateBlogArticlePayload,
} from "../types/blog.types";
import api from "../../../lib/api";

interface UseBlogReturn {
  articles: BlogArticle[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createArticle: (payload: CreateBlogArticlePayload) => Promise<BlogArticle>;
  updateArticle: (
    id: string,
    payload: UpdateBlogArticlePayload,
  ) => Promise<BlogArticle>;
  deleteArticle: (id: string) => Promise<void>;
}

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) return message.join("، ");
    if (message) return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "خطایی هنگام ارتباط با سرور رخ داد.";
};

export const useBlog = (): UseBlogReturn => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    const response = await api.get<BlogArticle[]>("/admin/blog");
    return response.data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchArticles();
      setArticles(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [fetchArticles]);

  useEffect(() => {
    let cancelled = false;

    fetchArticles()
      .then((data) => {
        if (!cancelled) {
          setArticles(data);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchArticles]);

  const createArticle = async (payload: CreateBlogArticlePayload) => {
    try {
      const response = await api.post<BlogArticle>("/admin/blog", payload);

      setArticles((current) => [response.data, ...current]);

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error), {
        cause: error,
      });
    }
  };

  const updateArticle = async (
    id: string,
    payload: UpdateBlogArticlePayload,
  ) => {
    try {
      const response = await api.patch<BlogArticle>(
        `/admin/blog/${id}`,
        payload,
      );

      setArticles((current) =>
        current.map((article) => (article.id === id ? response.data : article)),
      );

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error), {
        cause: error,
      });
    }
  };

  const deleteArticle = async (id: string) => {
    try {
      await api.delete(`/admin/blog/${id}`);

      setArticles((current) => current.filter((article) => article.id !== id));
    } catch (error) {
      throw new Error(getErrorMessage(error), {
        cause: error,
      });
    }
  };

  return {
    articles,
    loading,
    error,
    refresh,
    createArticle,
    updateArticle,
    deleteArticle,
  };
};
