import { Button } from '@/components/ui/button'
import { MealRepo } from '@/db-collections/meal'
import { IconDuplicate, IconTrash } from '@intentui/icons'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from '@/components/ui/menu'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'

export function MealActionsMenu({
  meal_id,
  children,
  onDuplicate,
  onDelete,
}: React.PropsWithChildren<{
  meal_id: string
  onDuplicate?: () => void
  onDelete?: () => void
}>) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const handleDelete = async () => {
    MealRepo.remove(meal_id)
    close()
    onDelete?.()
  }

  const handleDuplicate = async () => {
    MealRepo.duplicate(meal_id)
    onDuplicate?.()
  }

  return (
    <>
      <Menu>
        {children}
        <MenuContent placement="bottom start" className="w-full">
          <MenuItem onAction={handleDuplicate}>
            <IconDuplicate /> Duplicate
          </MenuItem>
          <MenuSeparator />
          <MenuItem isDanger onAction={() => setIsDeleteDialogOpen(true)}>
            <IconTrash /> Delete
          </MenuItem>
        </MenuContent>
      </Menu>

      <Modal isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <Modal.Content>
          <Modal.Header>Delete Meal</Modal.Header>
          <Modal.Body>Are you sure you want to delete this meal?</Modal.Body>
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
