<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ModuleRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass=ModuleRepository::class)
 * @ORM\Table(name="modules")
 */
class Module
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
     * @ORM\Column(type="text", nullable=true)
     */
    private ?string $description = null;

    /**
     * @var bool
     * @ORM\Column(type="boolean")
     */
    private bool $isActive = true;

    /**
     * @var bool
     * @ORM\Column(type="boolean")
     */
    private bool $isRecommended = false;

    /**
     * @var string|null
     * @ORM\Column(type="string", length=50, nullable=true)
     */
    private ?string $iconClass = null;

    /**
     * @var string|null
     * @ORM\Column(type="string", length=100, nullable=true)
     */
    private ?string $badgeClass = null;

    /**
     * @var int
     * @ORM\Column(type="integer")
     */
    private int $installCount = 0;

    /**
     * @var int
     * @ORM\Column(type="integer")
     */
    private int $rating = 0;

    /**
     * @var int|null
     * @ORM\ManyToOne(targetEntity=ModuleCategory::class, inversedBy="modules")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="category_id", referencedColumnName="id")
     * })
     */
    private ?ModuleCategory $category = null;

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function isRecommended(): bool
    {
        return $this->isRecommended;
    }

    public function setIsRecommended(bool $isRecommended): static
    {
        $this->isRecommended = $isRecommended;

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

    public function getBadgeClass(): ?string
    {
        return $this->badgeClass;
    }

    public function setBadgeClass(?string $badgeClass): static
    {
        $this->badgeClass = $badgeClass;

        return $this;
    }

    public function getInstallCount(): int
    {
        return $this->installCount;
    }

    public function setInstallCount(int $installCount): static
    {
        $this->installCount = $installCount;

        return $this;
    }

    public function getRating(): int
    {
        return $this->rating;
    }

    public function setRating(int $rating): static
    {
        $this->rating = $rating;

        return $this;
    }

    public function getCategory(): ?ModuleCategory
    {
        return $this->category;
    }

    public function setCategory(?ModuleCategory $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function __toString(): string
    {
        return $this->name ?? '';
    }
}
