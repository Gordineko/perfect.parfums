import mongoose from "mongoose";
import {
  normalizeLocalizedText,
  normalizeVariationAxis,
} from "../utils/catalogAdmin.helpers.js";
import { validateVariationAxes } from "../utils/catalogAdmin.validation.js";
import { syncVariationArtifactsForCategoryIds } from "../utils/variationArtifactsSync.js";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function normalizeSlug(slug) {
  return String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function getRootCategoryId(category) {
  if (!category) return null;
  if (!category.parentId) return category._id;
  return Array.isArray(category.ancestors) && category.ancestors.length
    ? category.ancestors[0]
    : category._id;
}

function mapCategoryNode(category, rootCategory) {
  const resolvedRoot = rootCategory || category;

  return {
    _id: category._id,
    parentId: category.parentId,
    slug: category.slug,
    title: category.title,
    description: category.description,
    variationTemplate: Array.isArray(category.variationTemplate) ? category.variationTemplate : [],
    path: category.path,
    fullSlug: category.fullSlug || (Array.isArray(category.path) ? category.path.join("/") : ""),
    ancestors: category.ancestors,
    level: category.level ?? (Array.isArray(category.ancestors) ? category.ancestors.length : 0),
    status: category.status,
    sort: category.sort,
    rootCategoryId: resolvedRoot?._id || category._id,
    rootCategoryTitle: resolvedRoot?.title || category.title,
    rootVariationTemplate: Array.isArray(resolvedRoot?.variationTemplate)
      ? resolvedRoot.variationTemplate
      : [],
    isVariationTemplateOwner:
      String(resolvedRoot?._id || category._id) === String(category._id),
  };
}

export function createCategoryAdminService({
  categoryRepo,
  productGroupWriteRepo,
  offerWriteRepo,
  characteristicMetaRepo,
}) {
  async function syncCategoryDerivedGroupData(categoryId) {
    return syncVariationArtifactsForCategoryIds({
      categoryIds: [categoryId],
      categoryRepo,
      productGroupWriteRepo,
      offerWriteRepo,
      characteristicMetaRepo,
    });
  }

  return {
    async create({
      parentId = null,
      slug,
      title,
      description,
      variationTemplate,
      status = "active",
      sort = 0,
    } = {}) {
      const cleanSlug = normalizeSlug(slug);
      if (!cleanSlug) throw badRequest("slug is required");

      const normalizedVariationTemplate = Array.isArray(variationTemplate)
        ? variationTemplate.map(normalizeVariationAxis)
        : [];
      validateVariationAxes(normalizedVariationTemplate);

      let parent = null;

      if (parentId) {
        if (!mongoose.Types.ObjectId.isValid(String(parentId))) {
          throw badRequest("Invalid parentId");
        }

        parent = await categoryRepo.getById(parentId);
        if (!parent) throw badRequest("Parent category not found");
      }

      const path = parent ? [...(parent.path || []), cleanSlug] : [cleanSlug];
      const fullSlug = path.join("/");
      const ancestors = parent ? [...(parent.ancestors || []), parent._id] : [];
      const level = ancestors.length;

      const existing = await categoryRepo.getByFullSlug(fullSlug, { status: null });
      if (existing) {
        throw badRequest("Category with this fullSlug already exists", { fullSlug });
      }

      const created = await categoryRepo.create({
        parentId: parent ? parent._id : null,
        slug: cleanSlug,
        title: normalizeLocalizedText(title),
        description: normalizeLocalizedText(description),
        variationTemplate: parent ? [] : normalizedVariationTemplate,
        path,
        fullSlug,
        ancestors,
        level,
        status,
        sort: Number(sort || 0),
      });

      const rootCategoryId = getRootCategoryId(created);
      const rootCategory =
        String(rootCategoryId) === String(created._id)
          ? created
          : await categoryRepo.getById(rootCategoryId);

      await syncCategoryDerivedGroupData(created._id);

      return mapCategoryNode(created, rootCategory || created);
    },

    async update({
      categoryId,
      parentId,
      slug,
      title,
      description,
      variationTemplate,
      status,
      sort,
    } = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
        throw badRequest("Invalid categoryId");
      }

      const current = await categoryRepo.getById(categoryId);
      if (!current) throw badRequest("Category not found");

      const nextSlug = slug !== undefined ? normalizeSlug(slug) : current.slug;
      if (!nextSlug) throw badRequest("slug is required");

      const normalizedVariationTemplate = Array.isArray(variationTemplate)
        ? variationTemplate.map(normalizeVariationAxis)
        : null;

      if (normalizedVariationTemplate) {
        validateVariationAxes(normalizedVariationTemplate);
      }

      let nextParentId = parentId;
      if (nextParentId === undefined) nextParentId = current.parentId || null;

      let parent = null;

      if (nextParentId) {
        if (!mongoose.Types.ObjectId.isValid(String(nextParentId))) {
          throw badRequest("Invalid parentId");
        }

        if (String(nextParentId) === String(categoryId)) {
          throw badRequest("Category cannot be parent of itself");
        }

        parent = await categoryRepo.getById(nextParentId);
        if (!parent) throw badRequest("Parent category not found");

        const descendantsIds = await categoryRepo.getDescendantIds(categoryId, {
          includeSelf: false,
          status: null,
        });

        if (descendantsIds.some((id) => String(id) === String(nextParentId))) {
          throw badRequest("Cannot move category inside its own subtree");
        }
      }

      const path = parent ? [...(parent.path || []), nextSlug] : [nextSlug];
      const fullSlug = path.join("/");
      const ancestors = parent ? [...(parent.ancestors || []), parent._id] : [];
      const level = ancestors.length;

      const existing = await categoryRepo.getByFullSlug(fullSlug, { status: null });
      if (existing && String(existing._id) !== String(categoryId)) {
        throw badRequest("Category with this fullSlug already exists", { fullSlug });
      }

      if (normalizedVariationTemplate && parent) {
        throw badRequest("variationTemplate can be changed only for root category");
      }

      const updated = await categoryRepo.updateById(categoryId, {
        parentId: parent ? parent._id : null,
        slug: nextSlug,
        title: title !== undefined ? normalizeLocalizedText(title) : current.title,
        description:
          description !== undefined
            ? normalizeLocalizedText(description)
            : (current.description || normalizeLocalizedText()),
        variationTemplate:
          normalizedVariationTemplate !== null
            ? normalizedVariationTemplate
            : (current.variationTemplate || []),
        path,
        fullSlug,
        ancestors,
        level,
        status: status !== undefined ? status : current.status,
        sort: sort !== undefined ? Number(sort || 0) : current.sort,
      });

      // Обновляем потомков, если изменилась ветка
      const descendantsIds = await categoryRepo.getDescendantIds(categoryId, {
        includeSelf: false,
        status: null,
      });

      if (descendantsIds.length) {
        const descendants = await categoryRepo.listByIds(descendantsIds);

        for (const item of descendants) {
          const tailPath = (item.path || []).slice((current.path || []).length);
          const nextPath = [...path, ...tailPath];
          const nextFullSlug = nextPath.join("/");

          const nextAncestors = [
            ...ancestors,
            updated._id,
            ...(item.ancestors || []).slice((current.ancestors || []).length + 1),
          ];

          await categoryRepo.updateById(item._id, {
            path: nextPath,
            fullSlug: nextFullSlug,
            ancestors: nextAncestors,
            level: nextAncestors.length,
          });
        }
      }

      const rootCategoryId = getRootCategoryId(updated);
      const rootCategory =
        String(rootCategoryId) === String(updated._id)
          ? updated
          : await categoryRepo.getById(rootCategoryId);

      await syncCategoryDerivedGroupData(updated._id);

      return mapCategoryNode(updated, rootCategory || updated);
    },

    async remove({ categoryId } = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(categoryId))) {
        throw badRequest("Invalid categoryId");
      }

      const current = await categoryRepo.getById(categoryId);
      if (!current) throw badRequest("Category not found");

      const children = await categoryRepo.listChildren(categoryId, { status: null });
      if (children.length) {
        throw badRequest("Cannot delete category with children");
      }

      await categoryRepo.deleteById(categoryId);
      return { ok: true };
    },
  };
}