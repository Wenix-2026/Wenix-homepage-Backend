<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ModuleCategoryRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass=ModuleCategoryRepository::class)
 * @ORM\Table(name="module_categories", indexes={@ORM\Index(name="slug", unique=true)})
 */
class ModuleCategory
{
    /**
     * @var int
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private ?int $id = null;

    /**
     * @var string
     * @ORM\Column(type="string", length=255)
     */
    private ?string $name = null;

    /**
     * @var string
     * @ORM\Column(type="string", length=255, unique=true)
     */
    private ?string $slug = null;

    /**
     * @var string|null
     * @ORM\Column(type="string", length=50, nullable=true)
     */
    private ?string $iconClass = null;

    /**
     * @var int
     * @ORM\Column(type="integer")
     */
    private int $totalCount = 0;

    /**
     * @var Collection|Module[]
     * @ORM\OneToMany(targetEntity=Module::class, mappedBy="category", cascade={"persist", "remove"})
     */
    private Collection $modules;

    public function __construct()
    {
        $this->modules = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function setSlug(?string $slug): static
    {
        $this->slug = $slug;

        return $this;
    }

    public function getIconClass(): ?string
    {
        return $this->iconClass;
    }

    public function setIconClass(?string $iconClass): static
    {
        $this->iconClass = $iconClass;

        return $this;
    }

    public function getTotalCount(): int
    {
        return $this->totalCount;
    }

    public function setTotalCount(int $totalCount): static
    {
        $this->totalCount = $totalCount;

        return $this;
    }

    /**
     * @return Module[]
     */
    public function getModules(): Collection
    {
        return $this->modules;
    }

    /**
     * @param Module[] $modules
     */
    public function setModules(array $modules): static
    {
        $this->modules = new ArrayCollection($modules);

        return $this;
    }

    /**
     * @param Module $module
     */
    public function addModule(Module $module): static
    {
        if ($this->modules->contains($module)) {
            return $this;
        }

        $this->modules->add($module);
        $module->setCategory($this);

        return $this;
    }

    /**
     * @param Module $module
     */
    public function removeModule(Module $module): static
    {
        if ($this->modules->removeElement($module)) {
            // set the owning side to null (unless already changed)
            if ($module->getCategory()?->getModules() === $this->modules) {
                $module->setCategory(null);
            }
        }

        return $this;
    }

    public function __toString(): string
    {
        return $this->name ?? '';
    }
}
