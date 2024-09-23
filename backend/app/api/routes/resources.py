import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Resource, ResourceCreate, ResourcePublic, ResourcesPublic, ResourceUpdate, Message

router = APIRouter()

@router.get("/", response_model=ResourcesPublic)
def read_resources(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve resources.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Resource)
        count = session.exec(count_statement).one()
        statement = select(Resource).offset(skip).limit(limit)
        resources = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Resource)
            .where(Resource.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Resource)
            .where(Resource.owner_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
        resources = session.exec(statement).all()

    return ResourcesPublic(data=resources, count=count)

@router.get("/{id}", response_model=ResourcePublic)
def read_resource(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get resource by ID.
    """
    resource = session.get(Resource, id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not current_user.is_superuser and (resource.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return resource

@router.post("/", response_model=ResourcePublic)
def create_resource(
    *, session: SessionDep, current_user: CurrentUser, resource_in: ResourceCreate
) -> Any:
    """
    Create new resource.
    """
    resource = Resource.model_validate(resource_in, update={"owner_id": current_user.id})
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.put("/{id}", response_model=ResourcePublic)
def update_resource(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    resource_in: ResourceUpdate,
) -> Any:
    """
    Update an resource.
    """
    resource = session.get(Resource, id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not current_user.is_superuser and (resource.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    update_dict = resource_in.model_dump(exclude_unset=True)
    resource.sqlmodel_update(update_dict)
    session.add(resource)
    session.commit()
    session.refresh(resource)
    return resource

@router.delete("/{id}")
def delete_resource(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete an resource.
    """
    resource = session.get(Resource, id)
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if not current_user.is_superuser and (resource.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(resource)
    session.commit()
    return Message(message="Resource deleted successfully")
