import {
  Button,
    Container,
    Flex,
    Heading,
    SkeletonText,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
  
import { ProjectsService } from "../../client";
import ActionsMenu from "../../components/Common/ActionsMenu";
import Navbar from "../../components/Common/Navbar";
import AddProject from "../../components/Projects/AddProject";
  
const projectsSearchSchema = z.object({
    page: z.number().catch(1),
});
export const Route = createFileRoute("/_layout/projects")({
  component: Projects,
  validateSearch: (search) => projectsSearchSchema.parse(search),
});
const PER_PAGE = 5;
  
function getProjectsQueryOptions({ page }: { page: number }) {
    return {
      queryFn: () =>
      ProjectsService.readProjects({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["projects", { page }],
  };
}
  
function ProjectsTable() {
  const queryClient = useQueryClient();
  const { page } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
    const setPage = (page: number) =>
    navigate({ search: (prev) => ({ ...prev, page }) });
  
    const {
    data: projects,
      isPending,
      isPlaceholderData,
    } = useQuery({
    ...getProjectsQueryOptions({ page }),
      placeholderData: (prevData) => prevData,
  });
  const hasNextPage = !isPlaceholderData && projects?.data.length === PER_PAGE;
  const hasPreviousPage = page > 1;
  
    useEffect(() => {
      if (hasNextPage) {
      queryClient.prefetchQuery(getProjectsQueryOptions({ page: page + 1 }));
      }
  }, [page, queryClient, hasNextPage]);
  
    return (
      <>
        <TableContainer>
          <Table size={{ base: "sm", md: "md" }}>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            {isPending ? (
              <Tbody>
                <Tr>
                  {new Array(4).fill(null).map((_, index) => (
                    <Td key={index}>
                      <SkeletonText noOfLines={1} paddingBlock="16px" />
                    </Td>
                  ))}
                </Tr>
              </Tbody>
            ) : (
              <Tbody>
                {projects?.data.map((project) => (
                  <Tr key={project.id} opacity={isPlaceholderData ? 0.5 : 1}>
                    <Td>{project.id}</Td>
                    <Td isTruncated maxWidth="150px">
                      {project.name}
                    </Td>
                    <Td
                      color={!project.description ? "ui.dim" : "inherit"}
                      isTruncated
                      maxWidth="150px"
                    >
                      {project.description || "N/A"}
                    </Td>
                    <Td>
                      <ActionsMenu type={"Project"} value={project} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            )}
          </Table>
        </TableContainer>
        <Flex
          gap={4}
          alignItems="center"
          mt={4}
          direction="row"
          justifyContent="flex-end"
        >
          <Button onClick={() => setPage(page - 1)} isDisabled={!hasPreviousPage}>
            Previous
          </Button>
          <span>Page {page}</span>
          <Button isDisabled={!hasNextPage} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </Flex>
      </>
    )
  }
  
  function Projects() {
    return (
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          Project Management
        </Heading>
  
        <Navbar type={"Project"} addModalAs={AddProject} />
        <ProjectsTable />
      </Container>
    )
  }
  