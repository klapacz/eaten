import { Button } from '@/components/ui/button'
import { MealTypeRepo } from '@/db-collections/meal-type'
import { IconTrash } from '@intentui/icons'
import { Menu, MenuContent, MenuItem } from '@/components/ui/menu'
import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'

export function MealTypeActionsMenu({
  meal_type_id,
  children,
  onDelete,
}: React.PropsWithChildren<{
  meal_type_id: string
  onDelete?: () => void
}>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const handleDelete = async () => {
    try {
      const tx = MealTypeRepo.remove(meal_type_id)
      await tx.isPersisted.promise
      onDelete?.()
    } catch (error) {
      toast.error('Failed to delete meal type', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <>
      <Menu>
        {children}
        <MenuContent placement="bottom start" className="w-full">
          <MenuItem isDanger onAction={() => setIsDeleteDialogOpen(true)}>
            <IconTrash /> Delete
          </MenuItem>
        </MenuContent>
      </Menu>

      <Modal isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Modal.Content>
          <Modal.Header>Delete Meal Type</Modal.Header>
          <Modal.Body>
            Are you sure you want to delete this meal type?
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>Cancel</Modal.Close>
            <Button intent="danger" onClick={handleDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  )
}
