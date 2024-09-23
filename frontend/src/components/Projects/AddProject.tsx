import {
  Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
  } from "@chakra-ui/react"
  import { useMutation, useQueryClient } from "@tanstack/react-query"
  import { type SubmitHandler, useForm } from "react-hook-form"
  
import { ApiError, type ProjectCreate, ProjectsService } from "../../client"
  import useCustomToast from "../../hooks/useCustomToast"
  import { handleError } from "../../utils"
  
interface AddProjectProps {
    isOpen: boolean
    onClose: () => void
  }
  
const AddProject = ({ isOpen, onClose }: AddProjectProps) => {
    const queryClient = useQueryClient()
    const showToast = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
  } = useForm<ProjectCreate>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        name: "",
        description: "",
      },
    })
  
    const mutation = useMutation({
    mutationFn: (data: ProjectCreate) =>
      ProjectsService.createProject({ requestBody: data }),
      onSuccess: () => {
      showToast("Success!", "Project created successfully.", "success")
        reset()
        onClose()
      },
      onError: (err: ApiError) => {
        handleError(err, showToast)
      },
      onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      },
    })
  
  const onSubmit: SubmitHandler<ProjectCreate> = (data) => {
      mutation.mutate(data)
    }
  
    return (
      <>
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }} isCentered>
        <ModalOverlay />
          <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add Project</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl isRequired isInvalid={!!errors.name} mt={4}>
                <FormLabel htmlFor="name">Name</FormLabel>
                <Input id="name" {...register("name", { required: "Name is required." })} placeholder="Name" type="text" />
                {errors.name && (<FormErrorMessage>{errors.name.message}</FormErrorMessage>)}
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel htmlFor="description">Description</FormLabel>
                <Input id="description" {...register("description")} placeholder="Description" type="text" />
                </FormControl>
            </ModalBody>
            <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>Save</Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }
  
export default AddProject
