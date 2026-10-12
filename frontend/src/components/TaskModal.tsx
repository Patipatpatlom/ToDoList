import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Trash2, User } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import type { Task } from '../services/taskService'

// Zod validation schema
const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required' })
    .max(120, { message: 'Title must be 120 characters or less' }),
  description: z
    .string()
    .max(500, { message: 'Description must be 500 characters or less' })
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assigneeName: z.string().max(80).optional(),
})

export type TaskFormValues = z.infer<typeof taskSchema>

export interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
  initialTask?: Task | null
  isLoading?: boolean
  onDelete?: (task: Task) => void
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  isLoading = false,
  onDelete,
}) => {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeName: '',
    },
  })

  // Synchronize form when initialTask changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        reset({
          title: initialTask.title,
          description: initialTask.description || '',
          priority: initialTask.priority,
          assigneeName: initialTask.assignee?.name || '',
        })
      } else {
        reset({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assigneeName: '',
        })
      }
    }
  }, [isOpen, initialTask, reset])

  const handleFormSubmit = async (data: TaskFormValues) => {
    await onSubmit(data)
    onClose()
  }

  const modalTitle = initialTask
    ? t('common.edit') + ' ' + (initialTask.title || t('dashboard.modal.title'))
    : t('dashboard.modal.title')

  return (
    <Modal
      id="task-form-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      description={t('dashboard.modal.description')}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Task Title */}
        <Input
          id="task-form-title"
          label={t('dashboard.modal.taskTitle')}
          placeholder={t('dashboard.modal.taskTitlePlaceholder')}
          error={errors.title?.message}
          {...register('title')}
          autoFocus
        />

        {/* Task Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-form-description"
            className="text-xs font-semibold text-slate-700 tracking-wide uppercase"
          >
            {t('dashboard.modal.descriptionLabel')}
          </label>
          <textarea
            id="task-form-description"
            rows={3}
            placeholder={t('dashboard.modal.descriptionPlaceholder')}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-rose-600 font-medium">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Priority & Assignee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Priority Selector */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-form-priority"
              className="text-xs font-semibold text-slate-700 tracking-wide uppercase"
            >
              {t('dashboard.modal.priorityLabel')}
            </label>
            <select
              id="task-form-priority"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              {...register('priority')}
            >
              <option value="LOW">{t('dashboard.priorities.low')}</option>
              <option value="MEDIUM">{t('dashboard.priorities.medium')}</option>
              <option value="HIGH">{t('dashboard.priorities.high')}</option>
            </select>
            {errors.priority && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Assignee Custom Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="task-form-assignee"
              className="text-xs font-semibold text-slate-700 tracking-wide uppercase"
            >
              {t('dashboard.modal.assigneeLabel')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="task-form-assignee"
                type="text"
                placeholder={t('dashboard.modal.assigneePlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition hover:border-slate-300"
                {...register('assigneeName')}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {initialTask && onDelete && (
              <Button
                id="task-modal-delete-btn"
                type="button"
                variant="ghost"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                onClick={() => onDelete(initialTask)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {t('common.delete')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              id="task-modal-cancel-btn"
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('dashboard.modal.cancelButton')}
            </Button>
            <Button
              id="task-modal-submit-btn"
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              {initialTask ? t('common.save') : t('dashboard.modal.submitButton')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
