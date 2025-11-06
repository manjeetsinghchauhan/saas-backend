import { Request, ResponseToolkit } from '@hapi/hapi';
import Project from '../../../models/project.model';
import i18n from '../../../config/i18n';

export const createProject = async (req: Request, h: ResponseToolkit) => {
  try {
    const { name } = req.payload as any;
    const authUser = (req as any).app?.authUser;
    const tenantId = authUser?.tenant;
    const userId = authUser?.id;

    if (!tenantId || !userId) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    const project = await Project.create({ 
      name, 
      tenant_id: tenantId, 
      created_by: userId 
    } as any);

    return h.response({
      success: true,
      message: i18n.__('project.created'),
      data: project,
    }).code(201);
  } catch (err: any) {
    return h.response({
      success: false,
      message: i18n.__('project.createFailed'),
      error: err.message,
    }).code(400);
  }
};

export const listProjects = async (req: Request, h: ResponseToolkit) => {
  try {
    const authUser = (req as any).app?.authUser;
    const tenantId = authUser?.tenant;
    if (!tenantId) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }
    const projects = await Project.findAll({ where: { tenant_id: tenantId } } as any);

    return h.response({
      success: true,
      message: i18n.__('project.list'),
      data: projects,
    }).code(200);
  } catch (err: any) {
    return h.response({
      success: false,
      message: i18n.__('project.listFailed'),
      error: err.message,
    }).code(400);
  }
};

export const getProjectById = async (req: Request, h: ResponseToolkit) => {
  try {
    const { id } = req.params as any;
    const authUser = (req as any).app?.authUser;
    const tenantId = authUser?.tenant;

    if (!tenantId) {
      return h.response({ success: false, message: 'Invalid token' }).code(401);
    }

    const project = await Project.findOne({ 
      where: { 
        id: id,
        tenant_id: tenantId 
      } 
    } as any);

    if (!project) {
      return h.response({ 
        success: false, 
        message: 'Project not found or access denied' 
      }).code(404);
    }

    return h.response({
      success: true,
      message: i18n.__('project.retrieved'),
      data: project,
    }).code(200);
  } catch (err: any) {
    return h.response({
      success: false,
      message: i18n.__('project.retrieveFailed'),
      error: err.message,
    }).code(400);
  }
};
